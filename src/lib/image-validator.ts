import sharp from "sharp"

// Known image magic bytes (first N bytes of the file)
const IMAGE_SIGNATURES = [
  { type: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: "webp_riff", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header (WebP starts with RIFF....WEBP)
  { type: "bmp", bytes: [0x42, 0x4d] },
] as const

/**
 * Validates that a base64 string is a real image and re-encodes it as a clean PNG.
 *
 * Defense layers:
 * 1. Magic byte check -- rejects files that don't start with known image headers
 * 2. Sharp decode -- rejects anything Sharp can't parse as pixel data
 * 3. Re-encode to PNG -- strips all metadata, EXIF, embedded payloads, trailing bytes
 *
 * Returns a clean base64 PNG string (no data URI prefix), or throws with a user-safe message.
 */
export async function validateAndReencodeImage(base64Input: string): Promise<string> {
  // Decode base64 to buffer
  const buffer = Buffer.from(base64Input, "base64")

  if (buffer.length < 8) {
    throw new Error("Invalid image: file too small")
  }

  // Check magic bytes
  const matchesMagic = IMAGE_SIGNATURES.some((sig) =>
    sig.bytes.every((byte, i) => buffer[i] === byte)
  )

  if (!matchesMagic) {
    throw new Error("Invalid image format. Only JPEG, PNG, GIF, WebP, and BMP are accepted.")
  }

  // For WebP, verify the WEBP marker at offset 8-11
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length < 12 || buffer.toString("ascii", 8, 12) !== "WEBP") {
      throw new Error("Invalid image format. Only JPEG, PNG, GIF, WebP, and BMP are accepted.")
    }
  }

  // Re-encode with Sharp: decode → strip everything → output clean PNG
  // If Sharp can't decode it, it's not a valid image (throws)
  try {
    const metadata = await sharp(buffer).metadata()

    // Sanity checks on dimensions
    if (!metadata.width || !metadata.height) {
      throw new Error("Invalid image: unable to read dimensions")
    }

    if (metadata.width > 8192 || metadata.height > 8192) {
      throw new Error("Image too large. Maximum dimensions: 8192x8192 pixels.")
    }

    // Re-encode as PNG (strips all non-pixel data: EXIF, comments, trailing bytes, polyglot payloads)
    // Resize if very large to keep payload reasonable for AI
    let pipeline = sharp(buffer).removeAlpha().png({ compressionLevel: 6 })

    if (metadata.width > 2048 || metadata.height > 2048) {
      pipeline = sharp(buffer)
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .removeAlpha()
        .png({ compressionLevel: 6 })
    }

    const cleanBuffer = await pipeline.toBuffer()
    return cleanBuffer.toString("base64")
  } catch (err) {
    // If Sharp threw, it couldn't parse the image data
    if ((err as Error).message?.includes("Input buffer contains unsupported image format")) {
      throw new Error("Invalid image format. The file could not be processed as an image.")
    }
    // Re-throw our own validation errors
    if ((err as Error).message?.startsWith("Invalid image") || (err as Error).message?.startsWith("Image too")) {
      throw err
    }
    throw new Error("Invalid image. The file could not be processed.")
  }
}

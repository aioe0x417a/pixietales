"use client"

// Deterministic particle data -- no Math.random to avoid hydration mismatch
// Positions are percentages (left/top), delays in seconds, durations in seconds

const LAVENDER_DOTS = [
  { left: 4.2,  top: 8.7,  delay: 0,    duration: 4.1 },
  { left: 11.8, top: 23.4, delay: 0.7,  duration: 5.3 },
  { left: 19.5, top: 61.2, delay: 1.4,  duration: 3.8 },
  { left: 27.3, top: 44.8, delay: 2.1,  duration: 6.2 },
  { left: 33.6, top: 78.5, delay: 0.3,  duration: 4.7 },
  { left: 42.1, top: 15.3, delay: 1.9,  duration: 5.1 },
  { left: 51.7, top: 55.9, delay: 0.6,  duration: 3.5 },
  { left: 58.4, top: 32.7, delay: 2.8,  duration: 6.8 },
  { left: 63.9, top: 87.1, delay: 0.9,  duration: 4.3 },
  { left: 71.2, top: 11.6, delay: 1.5,  duration: 5.9 },
  { left: 76.8, top: 49.3, delay: 3.2,  duration: 4.0 },
  { left: 83.5, top: 68.4, delay: 0.4,  duration: 7.1 },
  { left: 88.1, top: 29.8, delay: 2.4,  duration: 3.9 },
  { left: 93.7, top: 75.2, delay: 1.1,  duration: 5.5 },
  { left: 97.4, top: 42.0, delay: 0.8,  duration: 4.6 },
] as const

const GOLD_SPARKLES = [
  { left: 7.6,  top: 51.3, delay: 0.5,  duration: 5.7, size: 4 },
  { left: 15.3, top: 82.6, delay: 1.8,  duration: 4.4, size: 5 },
  { left: 24.9, top: 17.4, delay: 3.0,  duration: 6.3, size: 4 },
  { left: 36.7, top: 66.1, delay: 0.2,  duration: 5.0, size: 6 },
  { left: 45.5, top: 35.8, delay: 2.2,  duration: 3.7, size: 4 },
  { left: 54.8, top: 91.4, delay: 1.3,  duration: 6.6, size: 5 },
  { left: 67.2, top: 24.5, delay: 0.7,  duration: 4.9, size: 4 },
  { left: 74.6, top: 72.3, delay: 2.9,  duration: 5.4, size: 6 },
  { left: 85.3, top: 48.7, delay: 1.6,  duration: 3.6, size: 5 },
  { left: 92.1, top: 13.9, delay: 0.1,  duration: 7.2, size: 4 },
] as const

const CYAN_NEBULAS = [
  { left: 9.4,  top: 38.2, delay: 1.0,  duration: 6.1, size: 4 },
  { left: 31.8, top: 59.7, delay: 2.5,  duration: 4.8, size: 5 },
  { left: 48.6, top: 7.4,  delay: 0.4,  duration: 7.5, size: 3 },
  { left: 69.3, top: 83.6, delay: 1.7,  duration: 5.2, size: 5 },
  { left: 89.7, top: 57.1, delay: 3.1,  duration: 4.5, size: 4 },
] as const

export function StardustBackground() {
  return (
    <>
      {/* prefers-reduced-motion handled via CSS -- particles hidden when motion is reduced */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .stardust-particle {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* Lavender tiny dots */}
        {LAVENDER_DOTS.map((p, i) => (
          <span
            key={`lav-${i}`}
            className="stardust-particle"
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: i % 3 === 0 ? "3px" : "2px",
              height: i % 3 === 0 ? "3px" : "2px",
              borderRadius: "50%",
              backgroundColor: "#C4B5FD",
              opacity: 0.4,
              animation: `stardust ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Gold sparkles */}
        {GOLD_SPARKLES.map((p, i) => (
          <span
            key={`gold-${i}`}
            className="stardust-particle"
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              backgroundColor: "#FBBF24",
              opacity: 0.35,
              // Diamond/sparkle shape via box-shadow cross
              boxShadow: `0 0 ${p.size}px 1px #FBBF2466`,
              animation: `stardust ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Cyan nebula blobs */}
        {CYAN_NEBULAS.map((p, i) => (
          <span
            key={`cyan-${i}`}
            className="stardust-particle"
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              backgroundColor: "#38BDF8",
              opacity: 0.3,
              filter: "blur(1.5px)",
              animation: `stardust ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}

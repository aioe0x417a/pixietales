import type { Metadata, Viewport } from "next"
import { Fredoka, Nunito } from "next/font/google"
import { AuthProvider } from "@/components/auth/auth-provider"
import { StardustBackground } from "@/components/stardust-background"
import "./globals.css"

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
}

export const metadata: Metadata = {
  title: "PixieTales - Magical Bedtime Stories for Kids",
  description:
    "AI-powered bedtime stories for children ages 1-8. Personalized tales, beautiful illustrations, soothing narration, and calming bedtime routines. No ads, COPPA compliant.",
  keywords: [
    "bedtime stories",
    "kids stories",
    "AI stories",
    "children app",
    "bedtime routine",
    "story generator",
    "personalized stories",
  ],
  openGraph: {
    title: "PixieTales - Magical Bedtime Stories for Kids",
    description:
      "AI-powered bedtime stories personalized for your child. Beautiful illustrations, soothing narration, and calming bedtime routines.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen bg-background text-text antialiased">
        <StardustBackground />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

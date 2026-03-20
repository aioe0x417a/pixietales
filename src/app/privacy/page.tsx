import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Privacy Policy - PixieTales",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-primary/10 bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-heading text-lg font-bold text-primary">
              PixieTales
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl font-bold text-text mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none space-y-6 text-text">
          <p className="text-text-muted">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <h2 className="font-heading text-xl font-semibold mt-8">
            Children&apos;s Privacy (COPPA Compliance)
          </h2>
          <p>
            PixieTales is designed for use by parents and caregivers with
            children ages 1-6. We take children&apos;s privacy seriously and comply
            with the Children&apos;s Online Privacy Protection Act (COPPA).
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Children do not create accounts.</strong> Only parents
              create and manage child profiles. Child profiles contain a first
              name, age, and story preferences -- no email, phone, or other
              identifying information.
            </li>
            <li>
              <strong>No ads or tracking.</strong> We do not serve
              advertisements, use tracking pixels, or employ any third-party
              analytics that tracks individual users.
            </li>
            <li>
              <strong>Data stays on your device.</strong> Child profile data
              and story history are stored locally on your device (browser
              localStorage). We do not store child data on our servers.
            </li>
            <li>
              <strong>AI story generation.</strong> When you create a story,
              your child&apos;s first name and age are sent to our AI provider
              (OpenAI) to personalize the story. This data is used solely for
              story generation and is not stored by OpenAI per their data
              usage policy. No other personal information is transmitted.
            </li>
            <li>
              <strong>One-click data deletion.</strong> You can delete all
              child profiles and stories at any time from the Profiles page.
              This permanently removes all data from your device.
            </li>
          </ul>

          <h2 className="font-heading text-xl font-semibold mt-8">
            What Data We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Story generation requests:</strong> Child&apos;s first name,
              age, selected theme, and optional custom prompt are sent to our
              server-side API, which forwards them to OpenAI for story
              generation. These are not logged or stored.
            </li>
            <li>
              <strong>Drawing uploads:</strong> If you use the drawing-to-story
              feature, the uploaded image is sent to OpenAI for analysis. It is
              not stored on our servers.
            </li>
            <li>
              <strong>No cookies or fingerprinting.</strong> We do not use
              cookies, browser fingerprinting, or any cross-site tracking
              technologies.
            </li>
          </ul>

          <h2 className="font-heading text-xl font-semibold mt-8">
            Third-Party Services
          </h2>
          <p>
            We use the following third-party services for story generation:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>OpenAI</strong> -- for generating story text and
              illustrations. Data sent: child&apos;s first name, age, story theme,
              and optional drawing. OpenAI&apos;s API data usage policy states
              that API data is not used for training.
            </li>
            <li>
              <strong>Vercel</strong> -- for hosting. Standard server logs
              (IP addresses, request timestamps) are retained per Vercel&apos;s
              privacy policy.
            </li>
          </ul>

          <h2 className="font-heading text-xl font-semibold mt-8">
            Parental Consent
          </h2>
          <p>
            By creating a child profile and generating stories, you (the
            parent or guardian) consent to the transmission of your child&apos;s
            first name and age to our AI provider for the sole purpose of
            creating personalized bedtime stories.
          </p>

          <h2 className="font-heading text-xl font-semibold mt-8">
            Your Rights
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You can view, edit, or delete all child profiles and stories at
              any time.
            </li>
            <li>
              You can stop using the service at any time. No data is retained
              on our servers.
            </li>
            <li>
              For questions or data deletion requests, contact us at
              privacy@pixietales.app.
            </li>
          </ul>

          <h2 className="font-heading text-xl font-semibold mt-8">
            Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will
            be posted on this page with an updated date.
          </p>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMismatch, setShowMismatch] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/callback" },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      toast.error("Passwords don't match")
      setShowMismatch(true)
      return
    }

    setLoading(true)

    const { error } = await getSupabase().auth.signUp({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowConsent(true)
  }

  const handleConsent = async () => {
    setConsentLoading(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ consentVersion: "v1.0" }),
      })
    } catch (err) {
      console.error("Consent error:", err)
      toast.error("Failed to record consent. Please try again.")
      setConsentLoading(false)
      return
    }
    setConsentLoading(false)
    setSignedUp(true)
  }

  if (showConsent && !signedUp) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="font-heading text-3xl font-bold text-primary">PixieTales</span>
          </Link>
        </div>
        <div className="bg-surface rounded-2xl border border-primary/10 p-8 shadow-lg space-y-5">
          <h2 className="font-heading text-xl font-bold text-text text-center">Parental Consent</h2>
          <div className="text-sm text-text-muted space-y-3">
            <p>PixieTales is designed for children ages 1-8, used under parental supervision. By continuing, you confirm:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are the parent or legal guardian of any child using this app</li>
              <li>Child profile data (name, age, preferences) is stored securely in our database</li>
              <li>AI-generated stories are created using your child&apos;s name and preferences</li>
              <li>No data is shared with third parties or used for advertising</li>
              <li>You can delete all data at any time from account settings</li>
            </ul>
            <p>Read our full <Link href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary"
            />
            <span className="text-sm text-text">I confirm I am the parent/guardian and consent to the data processing described above.</span>
          </label>
          <Button
            onClick={handleConsent}
            className="w-full"
            disabled={!consentChecked || consentLoading}
          >
            {consentLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "I Agree — Continue"
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (signedUp) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="font-heading text-3xl font-bold text-primary">
              PixieTales
            </span>
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-primary/10 p-8 shadow-lg text-center space-y-4">
          <p className="text-text font-semibold text-lg">Account created!</p>
          <p className="text-text-muted text-sm">
            Check your email to confirm your account, then sign in.
          </p>
          <Link
            href="/login"
            className="inline-block text-primary font-semibold hover:underline text-sm"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <span className="font-heading text-3xl font-bold text-primary">
            PixieTales
          </span>
        </Link>
        <p className="text-text-muted">
          Create your account to start making magical stories.
        </p>
      </div>

      <form
        onSubmit={handleSignUp}
        className="bg-surface rounded-2xl border border-primary/10 p-8 shadow-lg space-y-5"
      >
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-3"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-primary/10" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-primary/10" />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-semibold text-text mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="pl-10"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-semibold text-text mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="pl-10 pr-10"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className={`mt-1 text-xs ${password.length >= 6 ? "text-green-500" : "text-text-muted"}`}>
            At least 6 characters
          </p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-sm font-semibold text-text mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="signup-confirm"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setShowMismatch(false)
              }}
              onBlur={() => {
                if (confirm && confirm !== password) {
                  setShowMismatch(true)
                }
              }}
              placeholder="Confirm your password"
              className="pl-10 pr-10"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {showMismatch && (
            <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Welcome back!")
    router.push("/dashboard")
  }

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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first")
      return
    }
    await getSupabase().auth.resetPasswordForEmail(email)
    toast.success("Check your email for a password reset link")
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
        <p className="text-text-muted">Welcome back! Sign in to continue.</p>
      </div>

      <form
        onSubmit={handleLogin}
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
          <label htmlFor="login-email" className="block text-sm font-semibold text-text mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-semibold text-text mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="pl-10 pr-10"
              required
              minLength={6}
              autoComplete="current-password"
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
          <button
            type="button"
            onClick={handleForgotPassword}
            className="mt-1.5 text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <p className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}

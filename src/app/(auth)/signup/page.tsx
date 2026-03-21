"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2, Mail, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      toast.error("Passwords don't match")
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

    toast.success("Account created! Check your email to confirm, then sign in.")
    router.push("/login")
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="pl-10"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-sm font-semibold text-text mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              id="signup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
              className="pl-10"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trash2, CreditCard, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabase } from "@/lib/supabase"
import { toast } from "sonner"

function randomArithmetic() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { a, b, answer: a + b, question: `What is ${a} + ${b}?` }
}

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailLoaded, setEmailLoaded] = useState(false)

  // Load user email on mount
  useEffect(() => {
    if (!emailLoaded) {
      getSupabase().auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null)
        setEmailLoaded(true)
      })
    }
  }, [emailLoaded])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [challenge] = useState(() => randomArithmetic())
  const [challengeAnswer, setChallengeAnswer] = useState("")
  const [deleting, setDeleting] = useState(false)

  const [portalLoading, setPortalLoading] = useState(false)

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast.error(json.error || "Failed to open billing portal")
      }
    } catch {
      toast.error("Failed to open billing portal")
    }
    setPortalLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (parseInt(challengeAnswer) !== challenge.answer) {
      toast.error("Incorrect answer. Please try again.")
      return
    }
    setDeleting(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || "Failed to delete account")
        setDeleting(false)
        return
      }
      await getSupabase().auth.signOut()
      router.push("/")
    } catch {
      toast.error("Failed to delete account")
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      <h1 className="font-heading text-3xl font-bold text-text">Account Settings</h1>

      {/* Account info */}
      <section className="bg-surface rounded-2xl border border-primary/10 p-6 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-text">Account</h2>
        <div className="text-sm text-text-muted">
          <span className="font-medium text-text">Email: </span>
          {emailLoaded ? (userEmail ?? "—") : "Loading..."}
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-surface rounded-2xl border border-primary/10 p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-text">Subscription</h2>
        <p className="text-sm text-text-muted">Manage your plan, payment method, and billing history.</p>
        <Button
          variant="outline"
          onClick={handleOpenPortal}
          disabled={portalLoading}
          className="flex items-center gap-2"
        >
          {portalLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Manage Subscription
        </Button>
      </section>

      {/* Delete account */}
      <section className="bg-surface rounded-2xl border border-red-500/20 p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-text-muted">
          Permanently delete your account and all associated data including child profiles,
          stories, and consent records. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4 border border-red-500/30 rounded-xl p-4 bg-red-500/5">
            <p className="text-sm font-semibold text-text">
              To confirm deletion, answer this question:
            </p>
            <p className="text-base font-bold text-red-500">{challenge.question}</p>
            <Input
              type="number"
              value={challengeAnswer}
              onChange={(e) => setChallengeAnswer(e.target.value)}
              placeholder="Your answer"
              className="max-w-[160px]"
              aria-label="Answer to confirmation question"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting || !challengeAnswer}
                className="flex items-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setChallengeAnswer("")
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

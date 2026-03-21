"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { PLANS } from "@/lib/plans"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function UpgradeBanner() {
  const [plan, setPlan] = useState<string | null>(null)
  const [storiesUsed, setStoriesUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    async function fetchPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const { data: family } = await supabase
          .from("families")
          .select("plan, stories_used_this_month")
          .eq("user_id", session.user.id)
          .single()

        setPlan(family?.plan || "free")
        setStoriesUsed(family?.stories_used_this_month || 0)
      } catch {
        setPlan("free")
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [])

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("Upgrade error:", err)
    } finally {
      setUpgrading(false)
    }
  }

  // Don't show for paid users, or while loading
  if (loading) return null
  if (plan && plan !== "free") return null

  const remaining = Math.max(0, PLANS.free.storiesPerMonth - storiesUsed)
  const isLimitReached = remaining === 0

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${
        isLimitReached
          ? "bg-amber-50 border border-amber-200 text-amber-900"
          : "bg-indigo-50 border border-indigo-100 text-indigo-800"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p>
          {isLimitReached
            ? "You have used all your free stories this month."
            : `You have ${remaining} free ${remaining === 1 ? "story" : "stories"} left this month.`}
        </p>
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isLimitReached
              ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Upgrade to Family plan for unlimited stories"
        >
          {upgrading ? "Redirecting..." : "Upgrade to Family -- Unlimited Stories"}
        </button>
      </div>
    </div>
  )
}

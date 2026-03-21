"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UpgradeBanner } from "@/components/upgrade-banner"
import Link from "next/link"
import {
  PlusCircle,
  BookOpen,
  Moon,
  Sparkles,
  Star,
  Clock,
  Users,
} from "lucide-react"
import { THEMES } from "@/lib/types"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function DashboardPage() {
  const profiles = useAppStore((s) => s.profiles)
  const activeProfile = useAppStore((s) => s.getActiveProfile())
  const stories = useAppStore((s) => s.stories)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)

  const sortedStories = [...stories].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const recentStories = activeProfile
    ? sortedStories.filter((s) => s.childProfileId === activeProfile.id).slice(0, 3)
    : sortedStories.slice(0, 3)

  const profileStoryCount = activeProfile
    ? stories.filter((s) => s.childProfileId === activeProfile.id).length
    : stories.length

  // If no profiles, show onboarding
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8 pulse-glow">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-text mb-4">
          Welcome to PixieTales!
        </h1>
        <p className="text-lg text-text-muted max-w-md mb-8">
          Let&apos;s set up your first child profile to start creating magical
          bedtime stories.
        </p>
        <Link href="/profiles">
          <Button size="lg">
            <Users className="w-5 h-5" />
            Create Child Profile
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <UpgradeBanner />
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-text">
          {activeProfile
            ? `${getGreeting()}! Ready for ${activeProfile.name}'s story?`
            : `${getGreeting()}!`}
        </h1>
        <p className="text-text-muted mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Profile Switcher */}
      {profiles.length > 1 && (
        <div
          role="group"
          aria-label="Select active profile"
          className="flex gap-3 overflow-x-auto pb-2"
        >
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setActiveProfile(profile.id)}
              aria-pressed={activeProfile?.id === profile.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap ${
                activeProfile?.id === profile.id
                  ? "border-primary bg-primary/5"
                  : "border-primary/10 hover:border-primary/30"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-heading font-bold text-sm">
                {profile.name[0]}
              </div>
              <span className="font-semibold text-sm">{profile.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/create">
          <Card className="p-6 hover:border-primary/30 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-text">
                  New Story
                </h3>
                <p className="text-sm text-text-muted">Create a new tale</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/library">
          <Card className="p-6 hover:border-primary/30 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-text">
                  Bookshelf
                </h3>
                <p className="text-sm text-text-muted">
                  {profileStoryCount} stories saved
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/bedtime">
          <Card className="p-6 hover:border-primary/30 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Moon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-text">
                  Bedtime Mode
                </h3>
                <p className="text-sm text-text-muted">Wind-down routine</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Theme Picker */}
      <div>
        <h2 className="font-heading text-xl font-semibold text-text mb-4">
          Quick Start -- Pick a Theme
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 flex-nowrap">
          {THEMES.map((theme) => (
            <Link
              key={theme.value}
              href={`/create?theme=${theme.value}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group flex-shrink-0 min-w-[96px]"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${theme.color}15` }}
              >
                <Star className="w-6 h-6" style={{ color: theme.color }} />
              </div>
              <span className="text-sm font-semibold text-text text-center">
                {theme.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Stories */}
      {recentStories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-text">
              Recent Stories
            </h2>
            <Link
              href="/library"
              className="text-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStories.map((story) => (
              <Link key={story.id} href={`/story/${story.id}`}>
                <Card className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all">
                  <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/40 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-heading font-semibold text-text truncate">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      {new Date(story.createdAt).toLocaleDateString()}
                      <span className="mx-1">&middot;</span>
                      {story.chapters.length} chapters
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

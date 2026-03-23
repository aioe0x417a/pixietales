"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BookOpen,
  Search,
  Clock,
  Trash2,
  ListMusic,
  Plus,
  X,
  Play,
  Sparkles,
  GripVertical,
  Moon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { THEMES, type Story, type Theme } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type SortOption = "newest" | "oldest" | "az"

function StoryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="h-40 overflow-hidden relative">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}

// ── Smart Recommendations ──────────────────────────────────────
// Suggests stories based on child's favorite themes and least-read themes

function getRecommendations(stories: Story[], profileId: string | null, favoriteThemes: Theme[]): Story[] {
  if (!profileId) return []
  const profileStories = stories.filter((s) => s.childProfileId === profileId)
  if (profileStories.length === 0) return []

  // Count stories per theme
  const themeCounts: Record<string, number> = {}
  for (const s of profileStories) {
    themeCounts[s.theme] = (themeCounts[s.theme] || 0) + 1
  }

  // Score each story: boost favorites, boost recent, boost variety (themes with fewer stories)
  const scored = profileStories.map((story) => {
    let score = 0
    // Favorite theme boost
    if (favoriteThemes.includes(story.theme as Theme)) score += 3
    // Variety boost: themes the child hasn't explored much
    const themeCount = themeCounts[story.theme] || 0
    if (themeCount <= 2) score += 2
    // Recency boost (more recent = slightly higher)
    const daysOld = (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld < 3) score += 1
    return { story, score }
  })

  // Sort by score desc, take top 6, shuffle slightly for variety
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 6).map((s) => s.story)
}

// ── Playlist Panel ─────────────────────────────────────────────

function PlaylistPanel() {
  const router = useRouter()
  const playlist = useAppStore((s) => s.playlist)
  const stories = useAppStore((s) => s.stories)
  const removeFromPlaylist = useAppStore((s) => s.removeFromPlaylist)
  const clearPlaylist = useAppStore((s) => s.clearPlaylist)
  const reorderPlaylist = useAppStore((s) => s.reorderPlaylist)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const playlistStories = playlist
    .map((id) => stories.find((s) => s.id === id))
    .filter(Boolean) as Story[]

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const newOrder = [...playlist]
    const [moved] = newOrder.splice(dragIdx, 1)
    newOrder.splice(idx, 0, moved)
    reorderPlaylist(newOrder)
    setDragIdx(idx)
  }

  const handleDragEnd = () => setDragIdx(null)

  const handleStartPlaylist = () => {
    if (playlistStories.length === 0) return
    router.push(`/story/${playlistStories[0].id}`)
  }

  if (playlistStories.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border border-primary/15"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-text">
            Tonight&apos;s Playlist
          </h2>
          <span className="text-xs text-text-muted bg-primary/10 px-2 py-0.5 rounded-full">
            {playlistStories.length} {playlistStories.length === 1 ? "story" : "stories"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={clearPlaylist}>
            Clear
          </Button>
          <Button size="sm" onClick={handleStartPlaylist}>
            <Play className="w-4 h-4" />
            Start Bedtime
          </Button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {playlistStories.map((story, idx) => (
          <div
            key={story.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex-shrink-0 w-48 rounded-xl bg-surface border border-primary/10 overflow-hidden group cursor-grab active:cursor-grabbing transition-all",
              dragIdx === idx && "opacity-50 scale-95"
            )}
          >
            <div className="relative">
              {story.chapters[0]?.imageUrl ? (
                <img
                  src={story.chapters[0].imageUrl}
                  alt={story.title}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary/30" />
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-primary">
                {idx + 1}
              </div>
              <button
                onClick={() => removeFromPlaylist(story.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-text-muted hover:text-error transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                aria-label={`Remove ${story.title} from playlist`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2.5 flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0" />
              <span className="text-xs font-medium text-text truncate">
                {story.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Recommendations Row ────────────────────────────────────────

function RecommendationsRow({ stories, onAdd }: { stories: Story[]; onAdd: (id: string) => void }) {
  if (stories.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-secondary" />
        <h2 className="font-heading text-lg font-semibold text-text">
          Recommended for Tonight
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.id}`}
            className="flex-shrink-0 w-40 rounded-xl bg-surface border border-primary/10 overflow-hidden group hover:border-primary/30 hover:shadow-md transition-all"
          >
            {story.chapters[0]?.imageUrl ? (
              <img
                src={story.chapters[0].imageUrl}
                alt={story.title}
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary/30" />
              </div>
            )}
            <div className="p-2.5">
              <p className="text-xs font-medium text-text truncate mb-1.5">
                {story.title}
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAdd(story.id)
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary-light transition-colors cursor-pointer"
                aria-label={`Add ${story.title} to playlist`}
              >
                <Plus className="w-3 h-3" />
                Add to playlist
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Library Page ──────────────────────────────────────────

export default function LibraryPage() {
  const stories = useAppStore((s) => s.stories)
  const activeProfile = useAppStore((s) => s.getActiveProfile())
  const removeStory = useAppStore((s) => s.removeStory)
  const playlist = useAppStore((s) => s.playlist)
  const addToPlaylist = useAppStore((s) => s.addToPlaylist)
  const [search, setSearch] = useState("")
  const [filterTheme, setFilterTheme] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const filteredStories = stories
    .filter((s) =>
      activeProfile ? s.childProfileId === activeProfile.id : true
    )
    .filter(
      (s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.childName.toLowerCase().includes(search.toLowerCase())
    )
    .filter((s) => (filterTheme ? s.theme === filterTheme : true))
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      // az
      return a.title.localeCompare(b.title)
    })

  const profileStories = stories.filter((s) =>
    activeProfile ? s.childProfileId === activeProfile.id : true
  )

  const recommendations = useMemo(
    () => getRecommendations(stories, activeProfile?.id ?? null, activeProfile?.favoriteThemes ?? []),
    [stories, activeProfile?.id, activeProfile?.favoriteThemes]
  )

  const handleDeleteConfirm = (id: string) => {
    removeStory(id)
    toast.success("Story deleted")
    setConfirmDeleteId(null)
  }

  const handleAddToPlaylist = (storyId: string) => {
    if (playlist.length >= 5) {
      toast.error("Playlist is full (max 5 stories)")
      return
    }
    if (playlist.includes(storyId)) {
      toast.info("Already in playlist")
      return
    }
    addToPlaylist(storyId)
    toast.success("Added to tonight's playlist")
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text">
          {activeProfile
            ? `${activeProfile.name}'s Bookshelf`
            : "Story Library"}
        </h1>
        <p className="text-text-muted mt-1">
          {filteredStories.length} stories saved
        </p>
      </div>

      {/* Bedtime Playlist */}
      <PlaylistPanel />

      {/* Smart Recommendations */}
      <RecommendationsRow stories={recommendations} onAdd={handleAddToPlaylist} />

      {/* Search, Filter, and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="pl-10"
          />
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{
            maskImage:
              "linear-gradient(to right, black calc(100% - 32px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, black calc(100% - 32px), transparent)",
          }}
        >
          <Button
            variant={filterTheme === null ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterTheme(null)}
          >
            All
          </Button>
          {THEMES.map((theme) => (
            <Button
              key={theme.value}
              variant={filterTheme === theme.value ? "primary" : "ghost"}
              size="sm"
              onClick={() =>
                setFilterTheme(
                  filterTheme === theme.value ? null : theme.value
                )
              }
            >
              {theme.label}
            </Button>
          ))}
        </div>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shrink-0"
          aria-label="Sort stories"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A-Z</option>
        </select>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-16 h-16 text-primary/20 mb-6" />
          <h2 className="font-heading text-xl font-semibold text-text mb-2">
            {profileStories.length === 0
              ? "No stories yet"
              : "No stories match your search"}
          </h2>
          <p className="text-text-muted mb-6">
            {profileStories.length === 0
              ? "Create your first magical story!"
              : "Try a different search or filter"}
          </p>
          {profileStories.length === 0 && (
            <Link href="/create">
              <Button>Create a Story</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story, i) => {
            const isInPlaylist = playlist.includes(story.id)
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden group hover:shadow-lg transition-all">
                  <Link href={`/story/${story.id}`} className="cursor-pointer">
                    {/* Book cover */}
                    {story.chapters[0]?.imageUrl ? (
                      <StoryImage
                        src={story.chapters[0].imageUrl}
                        alt={story.title}
                      />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/30 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/story/${story.id}`} className="cursor-pointer">
                      <h3
                        className="font-heading font-semibold text-text truncate group-hover:text-primary transition-colors"
                        title={story.title}
                      >
                        {story.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(story.createdAt).toLocaleDateString()}
                        <span>&middot;</span>
                        {story.chapters.length} ch.
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Add to playlist button */}
                        <button
                          onClick={() => handleAddToPlaylist(story.id)}
                          className={cn(
                            "p-2 transition-colors cursor-pointer rounded",
                            isInPlaylist
                              ? "text-primary"
                              : "text-text-muted/40 hover:text-primary"
                          )}
                          aria-label={
                            isInPlaylist
                              ? `${story.title} is in playlist`
                              : `Add ${story.title} to playlist`
                          }
                          title={isInPlaylist ? "In playlist" : "Add to playlist"}
                        >
                          <ListMusic className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        {confirmDeleteId === story.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Delete?</span>
                            <button
                              onClick={() => handleDeleteConfirm(story.id)}
                              className="text-xs font-semibold text-white bg-error hover:bg-error/90 transition-colors px-2 py-1 rounded cursor-pointer"
                              aria-label="Confirm delete"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-semibold text-text-muted hover:text-text transition-colors px-2 py-1 rounded cursor-pointer"
                              aria-label="Cancel delete"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(story.id)}
                            className="text-text-muted/40 hover:text-error transition-colors cursor-pointer p-2"
                            aria-label={`Delete ${story.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {story.theme !== "custom" && story.theme !== "drawing" && (
                      <span
                        className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${
                            THEMES.find((t) => t.value === story.theme)?.color ||
                            "#8B5CF6"
                          }15`,
                          color:
                            THEMES.find((t) => t.value === story.theme)?.color ||
                            "#8B5CF6",
                        }}
                      >
                        {THEMES.find((t) => t.value === story.theme)?.label}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

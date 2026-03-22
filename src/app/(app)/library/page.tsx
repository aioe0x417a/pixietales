"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, Search, Clock, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { THEMES } from "@/lib/types"
import { toast } from "sonner"

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

export default function LibraryPage() {
  const stories = useAppStore((s) => s.stories)
  const activeProfile = useAppStore((s) => s.getActiveProfile())
  const removeStory = useAppStore((s) => s.removeStory)
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

  const handleDeleteConfirm = (id: string) => {
    removeStory(id)
    toast.success("Story deleted")
    setConfirmDeleteId(null)
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
          {filteredStories.map((story, i) => (
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
          ))}
        </div>
      )}
    </div>
  )
}

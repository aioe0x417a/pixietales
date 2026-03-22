"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  PlusCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import {
  THEMES,
  COMPANIONS,
  BASE_COMPANIONS,
  type Theme,
  type Companion,
  type ChildProfile,
} from "@/lib/types"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase"

export default function ProfilesPage() {
  const profiles = useAppStore((s) => s.profiles)
  const activeProfileId = useAppStore((s) => s.activeProfileId)
  const addProfile = useAppStore((s) => s.addProfile)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const removeProfile = useAppStore((s) => s.removeProfile)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    age: 3,
    companion: "bunny" as Companion,
    favoriteThemes: [] as Theme[],
  })
  const [charactersByProfile, setCharactersByProfile] = useState<Record<string, { id: string; character_name: string; description: string }[]>>({})

  useEffect(() => {
    async function loadCharacters() {
      const { data } = await getSupabase()
        .from("character_log")
        .select("id, child_profile_id, character_name, description")
        .order("created_at", { ascending: false })

      if (data) {
        const grouped: Record<string, typeof data> = {}
        for (const char of data) {
          const pid = char.child_profile_id
          if (!grouped[pid]) grouped[pid] = []
          grouped[pid].push(char)
        }
        setCharactersByProfile(grouped)
      }
    }
    loadCharacters()
  }, [profiles])

  async function removeCharacter(charId: string, profileId: string) {
    await getSupabase().from("character_log").delete().eq("id", charId)
    setCharactersByProfile((prev) => ({
      ...prev,
      [profileId]: (prev[profileId] || []).filter((c) => c.id !== charId),
    }))
  }

  function resetForm() {
    setFormData({ name: "", age: 3, companion: "bunny", favoriteThemes: [] })
    setIsCreating(false)
    setEditingId(null)
  }

  function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Please enter a name")
      return
    }

    if (editingId) {
      updateProfile(editingId, formData)
      toast.success("Profile updated!")
    } else {
      addProfile(formData)
      toast.success("Profile created!")
    }
    resetForm()
  }

  function startEdit(profile: ChildProfile) {
    setEditingId(profile.id)
    setFormData({
      name: profile.name,
      age: profile.age,
      companion: profile.companion,
      favoriteThemes: profile.favoriteThemes,
    })
    setIsCreating(true)
  }

  function toggleTheme(theme: Theme) {
    setFormData((prev) => ({
      ...prev,
      favoriteThemes: prev.favoriteThemes.includes(theme)
        ? prev.favoriteThemes.filter((t) => t !== theme)
        : [...prev.favoriteThemes, theme],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text">
            Child Profiles
          </h1>
          <p className="text-text-muted mt-1">
            Create profiles for each child to personalize their stories.
          </p>
        </div>
        {!isCreating && profiles.length < 5 && (
          <Button onClick={() => setIsCreating(true)}>
            <PlusCircle className="w-5 h-5" />
            Add Child
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 mb-8 border-primary/20">
            <h2 className="font-heading text-xl font-semibold text-text mb-6">
              {editingId ? "Edit Profile" : "New Child Profile"}
            </h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Child&apos;s Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter name"
                    maxLength={30}
                    autoFocus
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Age
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, age }))}
                        aria-label={`Age ${age}`}
                        aria-pressed={formData.age === age}
                        className={`w-10 h-10 rounded-xl font-heading font-bold text-base transition-all cursor-pointer ${
                          formData.age === age
                            ? "bg-primary text-white shadow-md"
                            : "bg-primary/5 text-text hover:bg-primary/10"
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Companion */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Favorite Companion
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {BASE_COMPANIONS.map((comp) => (
                      <button
                        key={comp.value}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, companion: comp.value }))
                        }
                        aria-pressed={formData.companion === comp.value}
                        aria-label={comp.label}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all cursor-pointer ${
                          formData.companion === comp.value
                            ? "bg-primary/10 border-2 border-primary shadow-md"
                            : "bg-surface-alt border-2 border-transparent hover:border-primary/20"
                        }`}
                      >
                        <span className="text-2xl">{comp.emoji}</span>
                        <span className="text-xs font-semibold text-text">
                          {comp.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Favorite Themes */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">
                    Favorite Themes (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => toggleTheme(theme.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                          formData.favoriteThemes.includes(theme.value)
                            ? "text-white shadow-sm"
                            : "bg-surface-alt text-text-muted hover:bg-primary/5"
                        }`}
                        style={
                          formData.favoriteThemes.includes(theme.value)
                            ? { backgroundColor: theme.color }
                            : {}
                        }
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit">
                    <Check className="w-4 h-4" />
                    {editingId ? "Save Changes" : "Create Profile"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Profiles List */}
      {profiles.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-16 h-16 text-primary/20 mb-6" />
          <h2 className="font-heading text-xl font-semibold text-text mb-2">
            No profiles yet
          </h2>
          <p className="text-text-muted mb-6">
            Create your first child profile to start creating stories.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <PlusCircle className="w-5 h-5" />
            Create Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`p-5 transition-all ${
                  activeProfileId === profile.id
                    ? "border-primary/30 shadow-md"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveProfile(profile.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-heading font-bold text-xl transition-all ${
                          activeProfileId === profile.id
                            ? "bg-gradient-to-br from-primary to-accent ring-2 ring-primary ring-offset-2"
                            : "bg-primary/30"
                        }`}
                      >
                        {profile.name[0]}
                      </div>
                    </button>
                    <div>
                      <h3 className="font-heading font-semibold text-text text-lg">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-text-muted">
                        Age {profile.age} &middot;{" "}
                        {COMPANIONS.find((c) => c.value === profile.companion)
                          ?.emoji}{" "}
                        {COMPANIONS.find((c) => c.value === profile.companion)
                          ?.label}
                      </p>
                      {activeProfileId === profile.id && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-1">
                          <Star className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(profile)}
                      className="p-2 text-text-muted hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-primary/5"
                      aria-label={`Edit ${profile.name}'s profile`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(profile.id)}
                      className="p-2 text-text-muted hover:text-error transition-colors cursor-pointer rounded-lg hover:bg-error/5"
                      aria-label={`Delete ${profile.name}'s profile`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {confirmDeleteId === profile.id && (
                  <div className="mt-3 pt-3 border-t border-error/20 flex items-center justify-between gap-3">
                    <p className="text-sm text-text font-semibold">
                      Remove {profile.name}&apos;s profile?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          removeProfile(profile.id)
                          toast.success("Profile removed")
                          setConfirmDeleteId(null)
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {profile.favoriteThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-primary/5">
                    {profile.favoriteThemes.map((theme) => (
                      <span
                        key={theme}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${
                            THEMES.find((t) => t.value === theme)?.color ||
                            "#8B5CF6"
                          }15`,
                          color:
                            THEMES.find((t) => t.value === theme)?.color ||
                            "#8B5CF6",
                        }}
                      >
                        {THEMES.find((t) => t.value === theme)?.label}
                      </span>
                    ))}
                  </div>
                )}

                {(charactersByProfile[profile.id] || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary/5">
                    <p className="text-xs font-semibold text-primary mb-2">
                      Story Universe
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(charactersByProfile[profile.id] || []).map((char) => (
                        <span
                          key={char.id}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                          title={char.description}
                        >
                          {char.character_name}
                          <button
                            onClick={() => removeCharacter(char.id, profile.id)}
                            className="ml-0.5 hover:text-error transition-colors cursor-pointer"
                            aria-label={`Remove ${char.character_name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

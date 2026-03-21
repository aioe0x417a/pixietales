import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return crypto.randomUUID()
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function getAgeGroup(age: number): "baby" | "toddler" | "preschool" | "kindergarten" | "early-reader" {
  if (age <= 1) return "baby"
  if (age <= 2) return "toddler"
  if (age <= 4) return "preschool"
  if (age <= 6) return "kindergarten"
  return "early-reader"
}

export function getWordCount(age: number): { min: number; max: number } {
  if (age <= 2) return { min: 50, max: 100 }
  if (age <= 4) return { min: 150, max: 250 }
  if (age <= 6) return { min: 250, max: 400 }
  return { min: 400, max: 600 }
}

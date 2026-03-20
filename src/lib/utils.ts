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

export function getAgeGroup(age: number): "toddler" | "preschool" | "kindergarten" {
  if (age <= 2) return "toddler"
  if (age <= 4) return "preschool"
  return "kindergarten"
}

export function getWordCount(age: number): { min: number; max: number } {
  if (age <= 2) return { min: 100, max: 150 }
  if (age <= 4) return { min: 200, max: 300 }
  return { min: 350, max: 500 }
}

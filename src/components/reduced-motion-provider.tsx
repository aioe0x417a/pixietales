"use client"

import { createContext, useContext } from "react"
import { useReducedMotion } from "framer-motion"

const ReducedMotionContext = createContext(false)

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion() || false
  return (
    <ReducedMotionContext.Provider value={prefersReduced}>
      {children}
    </ReducedMotionContext.Provider>
  )
}

export function usePreferReducedMotion() {
  return useContext(ReducedMotionContext)
}

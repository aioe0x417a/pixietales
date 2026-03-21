export const PLANS = {
  free: {
    name: "Free",
    storiesPerMonth: 3,
    maxProfiles: 1,
    price: 0,
  },
  family: {
    name: "Family",
    storiesPerMonth: -1, // unlimited
    maxProfiles: 5,
    price: 799, // cents
  },
  annual: {
    name: "Annual",
    storiesPerMonth: -1, // unlimited
    maxProfiles: 5,
    price: 5999, // cents/year
  },
} as const

export type PlanType = keyof typeof PLANS

export type Kind =
  | 'tumbler' | 'calculator' | 'charger' | 'umbrella' | 'lanyard' | 'earbuds' | 'notebook'
  | 'flashdrive' | 'glasscase' | 'hoodie' | 'keys' | 'tote' | 'powerbank'

export const BUILDINGS = ['CICS', 'CEA', 'CIT', 'Library', 'Gymnasium', 'Cafeteria'] as const
export const CATEGORIES = ['Drinkware', 'Electronics', 'Stationery', 'Accessories', 'Apparel', 'Bags', 'IDs & Keys'] as const
export type Building = (typeof BUILDINGS)[number]
export type Category = (typeof CATEGORIES)[number]
export type Status = 'Unclaimed' | 'Claimed'

export interface Item {
  id: string
  title: string
  category: Category
  building: Building
  spot: string
  description: string
  date: string // ISO yyyy-mm-dd
  status: Status
  kind: Kind
  colors: [string, string, string]
  image?: string // user-uploaded photo (data URI); seed items render a generated thumbnail
  reported?: boolean
}

export interface Features {
  hist: number[]
  edge: number
  grid: number[]
  aspect: number
  fill: number
  colors: string[]
}

export interface Breakdown {
  color: number
  edge: number
  shape: number
}

export interface Tag {
  label: string
  kind: 'color' | 'keyword' | 'place' | 'category'
}

export type MatchMode = 'hybrid' | 'visual-only' | 'text-only'

export interface MatchQuery {
  description: string
  location: string
  category: string
  image: Features | null
}

export interface MatchResult {
  item: Item
  overall: number
  visual: number
  text: number
  breakdown: Breakdown
  tags: Tag[]
  mode: MatchMode
}

export const VISUAL_WEIGHT = 0.55
export const TEXT_WEIGHT = 0.45

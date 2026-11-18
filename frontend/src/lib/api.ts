import { toPngBlob } from './imaging'
import type { Item, MatchMode, MatchResult, Tag } from './types'

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

async function timed(url: string, init: RequestInit = {}, ms = 1500): Promise<Response> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctl.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function probeBackend(): Promise<boolean> {
  try {
    const r = await timed(`${API_BASE}/api/health`)
    return r.ok
  } catch {
    return false
  }
}

interface RemoteResult {
  id: string
  overall: number
  visual: number
  text: number
  breakdown: { color: number; edge: number; shape: number }
  tags: Tag[]
  mode: MatchMode
}

export async function remoteIds(): Promise<Set<string>> {
  const r = await timed(`${API_BASE}/api/items`)
  const j = (await r.json()) as { items: { id: string }[] }
  return new Set(j.items.map((i) => i.id))
}

export async function remoteReport(item: Item, imageSrc: string): Promise<void> {
  const fd = new FormData()
  fd.set('id', item.id)
  fd.set('title', item.title)
  fd.set('category', item.category)
  fd.set('building', item.building)
  fd.set('spot', item.spot)
  fd.set('date', item.date)
  fd.set('description', item.description)
  fd.set('image', await toPngBlob(imageSrc), 'item.png')
  const r = await timed(`${API_BASE}/api/report`, { method: 'POST', body: fd }, 8000)
  if (!r.ok) throw new Error(`report failed (${r.status})`)
}

export async function remoteMatch(
  items: Item[],
  q: { description: string; location: string; category: string; imageSrc: string | null },
): Promise<MatchResult[]> {
  const fd = new FormData()
  fd.set('description', q.description)
  fd.set('location', q.location)
  fd.set('category', q.category)
  if (q.imageSrc) fd.set('image', await toPngBlob(q.imageSrc), 'query.png')
  const r = await timed(`${API_BASE}/api/match`, { method: 'POST', body: fd }, 10000)
  if (!r.ok) throw new Error(`match failed (${r.status})`)
  const j = (await r.json()) as { results: RemoteResult[] }
  const byId = new Map(items.map((i) => [i.id, i]))
  return j.results.flatMap((x) => {
    const item = byId.get(x.id)
    return item ? [{ item, overall: x.overall, visual: x.visual, text: x.text, breakdown: x.breakdown, tags: x.tags, mode: x.mode }] : []
  })
}

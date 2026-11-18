import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SEED_ITEMS } from './data/seed'
import { probeBackend, remoteIds, remoteReport } from './lib/api'
import { itemImage } from './lib/thumbs'
import type { Item } from './lib/types'

const KEY_REPORTED = 'bb.reported.v1'
const KEY_CLAIMS = 'bb.claims.v1'

export interface Claim {
  name: string
  studentId: string
  at: string
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable: state still works for this session */
  }
}

interface Ctx {
  items: Item[]
  claims: Record<string, Claim>
  backendOnline: boolean
  addItem: (item: Item) => void
  claimItem: (id: string, claim: Claim) => void
}

const ItemsContext = createContext<Ctx | null>(null)

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [reported, setReported] = useState<Item[]>(() => load<Item[]>(KEY_REPORTED, []))
  const [claims, setClaims] = useState<Record<string, Claim>>(() => load(KEY_CLAIMS, {}))
  const [backendOnline, setBackendOnline] = useState(false)

  const items = useMemo(
    () => [...reported, ...SEED_ITEMS].map((i) => (claims[i.id] ? { ...i, status: 'Claimed' as const } : i)),
    [reported, claims],
  )

  // Probe the FastAPI backend; when it appears, sync any locally reported items it has not seen.
  useEffect(() => {
    let alive = true
    const run = async () => {
      const ok = await probeBackend()
      if (!alive) return
      setBackendOnline(ok)
      if (ok) {
        try {
          const known = await remoteIds()
          for (const it of reported) if (!known.has(it.id)) await remoteReport(it, itemImage(it))
        } catch {
          /* sync is best effort */
        }
      }
    }
    void run()
    // re-check when the tab regains focus instead of polling, to keep the console quiet on hosted deploys
    window.addEventListener('focus', run)
    return () => {
      alive = false
      window.removeEventListener('focus', run)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reported.length])

  const addItem = useCallback((item: Item) => {
    setReported((prev) => {
      const next = [item, ...prev]
      save(KEY_REPORTED, next)
      return next
    })
  }, [])

  const claimItem = useCallback((id: string, claim: Claim) => {
    setClaims((prev) => {
      const next = { ...prev, [id]: claim }
      save(KEY_CLAIMS, next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ items, claims, backendOnline, addItem, claimItem }), [items, claims, backendOnline, addItem, claimItem])
  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}

export function useItems(): Ctx {
  const c = useContext(ItemsContext)
  if (!c) throw new Error('useItems must be used inside ItemsProvider')
  return c
}

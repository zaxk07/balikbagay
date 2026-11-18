import { useEffect, useState } from 'react'

export type RouteName = 'home' | 'scanner' | 'inventory' | 'report' | 'how'

export const ROUTES: { name: RouteName; path: string; label: string }[] = [
  { name: 'home', path: '/', label: 'Home' },
  { name: 'scanner', path: '/scanner', label: 'Smart Scanner' },
  { name: 'inventory', path: '/inventory', label: 'Found Inventory' },
  { name: 'report', path: '/report', label: 'Report Found Item' },
  { name: 'how', path: '/how-it-works', label: 'How It Works' },
]

export interface Route {
  name: RouteName
  params: URLSearchParams
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  const match = ROUTES.find((r) => r.path === path) ?? ROUTES[0]
  return { name: match.name, params: new URLSearchParams(query) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const href = (name: RouteName, query?: Record<string, string>) => {
  const path = ROUTES.find((r) => r.name === name)!.path
  const q = query ? '?' + new URLSearchParams(query).toString() : ''
  return `#${path}${q}`
}

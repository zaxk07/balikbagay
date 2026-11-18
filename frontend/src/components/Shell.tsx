import { ArrowRight, CornerDownLeft, Menu, ScanSearch, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildModel, scoreQuery } from '../lib/text'
import { itemDoc } from '../lib/matcher'
import { href, ROUTES, type RouteName } from '../router'
import { useItems } from '../store'
import { ItemThumb } from './bits'

function QuickSearch({ onClose }: { onClose: () => void }) {
  const { items } = useItems()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const model = useMemo(() => buildModel(items.map(itemDoc)), [items])
  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])

  const hits = useMemo(() => {
    if (!q.trim()) return []
    const { scores } = scoreQuery(model, q)
    return items.map((it, i) => ({ it, s: scores[i] })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5)
  }, [q, items, model])

  const go = (hash: string) => {
    window.location.hash = hash
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Quick search" className="pop w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (hits[0]) go(`#/inventory?q=${encodeURIComponent(q.trim())}`)
          }}
          className="flex items-center gap-3 border-b border-line px-4"
        >
          <Search size={18} className="text-muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search found items, e.g. black tumbler" className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" aria-label="Search found items" />
          <kbd className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-muted">esc</kbd>
        </form>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {hits.length > 0 ? (
            <>
              <p className="px-2 pb-1 pt-2 text-xs font-semibold text-muted">Best text matches</p>
              {hits.map(({ it, s }) => (
                <button key={it.id} onClick={() => go(`#/inventory?q=${encodeURIComponent(it.title)}`)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-paper">
                  <ItemThumb item={it} className="!w-11 rounded-lg" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{it.title}</span><span className="text-xs text-muted">{it.building} · {it.status}</span></span>
                  <span className="font-mono text-xs text-cv-ink">cos {s.toFixed(2)}</span>
                </button>
              ))}
              <p className="flex items-center gap-1 px-2 py-2 text-xs text-muted"><CornerDownLeft size={12} /> Enter to open all results in Inventory</p>
            </>
          ) : (
            <>
              <p className="px-2 pb-1 pt-2 text-xs font-semibold text-muted">{q.trim() ? 'No text match. Try the visual scanner instead.' : 'Jump to'}</p>
              {ROUTES.map((r) => (
                <button key={r.name} onClick={() => go(`#${r.path}`)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-paper">
                  {r.label}<ArrowRight size={14} className="text-muted" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function Navbar({ current }: { current: RouteName }) {
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const { backendOnline } = useItems()

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-2xl border border-white/70 bg-white/80 px-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] ring-1 ring-line backdrop-blur-md">
        <a href={href('home')} className="flex items-center gap-2 pr-1 font-display text-[17px] font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><ScanSearch size={17} strokeWidth={2.4} /></span>
          <span className="hidden sm:inline">BalikBagay</span>
        </a>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {ROUTES.map((r) => (
            <a key={r.name} href={href(r.name)} aria-current={current === r.name ? 'page' : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${current === r.name ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink'}`}>
              {r.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearch(true)} className="flex h-9 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-sm text-muted transition-colors hover:border-slate-300" aria-label="Open quick search">
            <Search size={15} /><span className="hidden whitespace-nowrap 2xl:inline">Search</span>
            <kbd className="hidden whitespace-nowrap rounded border border-line bg-white px-1.5 font-mono text-[10px] 2xl:inline">Ctrl K</kbd>
          </button>
          <span className="hidden items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 font-mono text-[11px] font-medium text-ok-ink xl:inline-flex whitespace-nowrap" title={backendOnline ? 'FastAPI backend detected at localhost:8000' : 'Running fully in-browser'}>
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-ok' : 'bg-ok/60'}`} />
            {backendOnline ? 'FastAPI CV Engine' : 'In-Browser CV Engine'}
          </span>
          <button className="btn-ghost !px-2.5 !py-2 lg:hidden" onClick={() => setMenu((o) => !o)} aria-label="Toggle menu" aria-expanded={menu}>
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menu && (
        <nav className="pop mx-auto mt-2 max-w-5xl rounded-2xl border border-line bg-white/95 p-2 shadow-soft backdrop-blur-md lg:hidden" aria-label="Mobile">
          {ROUTES.map((r) => (
            <a key={r.name} href={href(r.name)} onClick={() => setMenu(false)}
              className={`block rounded-xl px-3 py-3 text-sm font-medium ${current === r.name ? 'bg-brand-soft text-brand' : 'text-ink'}`}>{r.label}</a>
          ))}
        </nav>
      )}
      {search && <QuickSearch onClose={() => setSearch(false)} />}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>BalikBagay · Smart computer-vision lost &amp; found for BatStateU Alangilan Campus.</p>
        <p className="font-mono text-xs text-cv-ink">score = 0.55·visual + 0.45·text</p>
      </div>
    </footer>
  )
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="rise mb-10 max-w-3xl">
      <p className="badge-cv mb-4">{eyebrow}</p>
      <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl">{title}</h1>
      {children && <p className="mt-4 text-lg text-muted">{children}</p>}
    </div>
  )
}

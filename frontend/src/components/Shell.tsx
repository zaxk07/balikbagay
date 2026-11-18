import { Menu, ScanSearch, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { href, ROUTES, type RouteName } from '../router'
import { useItems } from '../store'

export function Navbar({ current }: { current: RouteName }) {
  const [open, setOpen] = useState(false)
  const { backendOnline } = useItems()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href={href('home')} className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white"><ScanSearch size={18} strokeWidth={2.4} /></span>
          BalikBagay
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {ROUTES.map((r) => (
            <a
              key={r.name}
              href={href(r.name)}
              aria-current={current === r.name ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${current === r.name ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
            >
              {r.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[11px] text-muted lg:inline-flex"
            title={backendOnline ? 'FastAPI backend detected at localhost:8000' : 'Running fully in-browser'}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-ok' : 'bg-muted/50'}`} />
            {backendOnline ? 'FastAPI engine' : 'In-browser engine'}
          </span>
          <button className="btn-ghost !px-2.5 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="pop border-t border-line bg-paper px-4 pb-3 md:hidden" aria-label="Mobile">
          {ROUTES.map((r) => (
            <a
              key={r.name}
              href={href(r.name)}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-3 text-sm font-medium ${current === r.name ? 'bg-ink text-paper' : 'text-ink'}`}
            >
              {r.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>BalikBagay · Smart computer-vision lost &amp; found for BatStateU Alangilan Campus.</p>
        <p className="font-mono text-xs">score = 0.55 · visual + 0.45 · text</p>
      </div>
    </footer>
  )
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="rise mb-10 max-w-3xl">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl">{title}</h1>
      {children && <p className="mt-4 text-lg text-muted">{children}</p>}
    </div>
  )
}

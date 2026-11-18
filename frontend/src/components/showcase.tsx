import { ArrowRight, Cpu, Gauge, Lock, ScanSearch, Sparkles, TextSearch } from 'lucide-react'
import { useMemo } from 'react'
import { BUILDINGS, type Item } from '../lib/types'
import { href } from '../router'
import { useItems } from '../store'
import { ItemThumb } from './bits'
import { ScrollStackingCards, type StackCard } from './ui/scroll-stacking-cards'

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">{children}</div>
)

function MatchingVisual() {
  const bins = [0.05, 0.32, 0.12, 0.04, 0.02, 0.09, 0.22, 0.08, 0.03, 0.15, 0.06, 0.02]
  const terms: [string, number][] = [['tumbler', 0.92], ['black', 0.71], ['aquaflask', 0.58], ['cics', 0.33]]
  return (
    <Panel>
      <p className="font-mono text-[11px] uppercase tracking-wider text-white/45">HSV hue bins</p>
      <div className="mt-2 flex h-16 items-end gap-1">
        {bins.map((v, i) => <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${v * 300}%`, maxHeight: '100%', background: `hsl(${(i / 12) * 360} 72% 52%)` }} />)}
      </div>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-white/45">TF-IDF weights</p>
      <ul className="mt-2 space-y-1.5 font-mono text-xs">
        {terms.map(([t, w]) => (
          <li key={t} className="flex items-center gap-2"><span className="w-20 text-white/80">{t}</span>
            <span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-full rounded-full bg-cv" style={{ width: `${w * 100}%` }} /></span>
            <span className="w-8 text-right text-white/55">{w.toFixed(2)}</span></li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-xs text-white/50">0.55 × 0.84 + 0.45 × 0.77 = <span className="text-cv">0.81</span></p>
    </Panel>
  )
}

function RecoveryVisual({ items }: { items: Item[] }) {
  const stats = useMemo(() => BUILDINGS.map((b) => {
    const list = items.filter((i) => i.building === b)
    return { b, total: list.length, claimed: list.filter((i) => i.status === 'Claimed').length }
  }), [items])
  const max = Math.max(1, ...stats.map((s) => s.total))
  const claimed = stats.reduce((a, s) => a + s.claimed, 0)
  const rate = items.length ? Math.round((claimed / items.length) * 100) : 0
  return (
    <Panel>
      <div className="flex items-end justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/45">Campus recovery rate</p>
        <p className="font-mono text-4xl font-medium leading-none text-ok">{rate}%</p>
      </div>
      <ul className="mt-5 space-y-2.5">
        {stats.map((s) => (
          <li key={s.b} className="flex items-center gap-3 font-mono text-xs">
            <span className="w-20 truncate text-white/70">{s.b}</span>
            <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <span className="h-full bg-ok" style={{ width: `${(s.claimed / max) * 100}%` }} />
              <span className="h-full bg-cv" style={{ width: `${((s.total - s.claimed) / max) * 100}%` }} />
            </span>
            <span className="w-10 text-right text-white/55">{s.claimed}/{s.total}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function EngineVisual() {
  return (
    <Panel>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_45%,#1d3d34,#0b1f1a)]">
        <div className="scan-line" />
        <div className="absolute inset-0 grid place-items-center"><div className="reticle-pulse h-28 w-28 rounded-2xl border-2 border-dashed border-ok/80" /></div>
        <div className="absolute left-1/2 top-1/2 h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-slate-900 ring-1 ring-white/20" />
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-ok">canvas · HSV · Sobel</span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/70">0 bytes uploaded</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px] text-white/60">
        {[['256', 'hue bins'], ['8×8', 'edge grid'], ['1.6', 'aspect']].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-white/5 p-2"><p className="text-base text-white">{v}</p>{l}</div>
        ))}
      </div>
    </Panel>
  )
}

function InventoryVisual({ items }: { items: Item[] }) {
  return (
    <Panel>
      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, 6).map((i) => (
          <div key={i.id} className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
            <ItemThumb item={i} />
            <span className={`absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${i.status === 'Claimed' ? 'bg-ok/90 text-white' : 'bg-cv/90 text-white'}`}>{i.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

const TILES = [
  { icon: ScanSearch, big: 'Visual', small: 'HSV + Sobel', tone: 'bg-white/[0.06]' },
  { icon: TextSearch, big: 'TF-IDF', small: 'Campus synonyms', tone: 'bg-white/[0.06]' },
  { icon: Gauge, big: '0.55 / 0.45', small: 'Explainable fusion', tone: 'bg-gradient-to-br from-cv to-[#b45309]' },
  { icon: Cpu, big: 'In-browser', small: 'No server needed', tone: 'bg-white/[0.06]' },
  { icon: Lock, big: 'Verified', small: 'Claim by hidden detail', tone: 'bg-gradient-to-br from-ok to-ok-ink' },
  { icon: Sparkles, big: '60 fps', small: 'Spring-smoothed motion', tone: 'bg-white/[0.06]' },
]

/** Landing section: Experience Design–style bento header + scroll-stacking BalikBagay showcase. */
export function Showcase() {
  const { items } = useItems()
  const cards: StackCard[] = [
    { id: 'match', title: 'Visual + TF-IDF Matching', eyebrow: 'Lost & Found', accent: '#D97706', href: href('scanner'), cta: 'Try the Smart Scanner',
      description: 'One photo and a few words. Colour histograms, edge texture and weighted terms are fused into a single score you can audit.', visual: <MatchingVisual /> },
    { id: 'recovery', title: 'Campus Recovery Analytics', eyebrow: 'Analytics', accent: '#10B981', href: href('inventory'), cta: 'Browse found inventory',
      description: 'See where things go missing and how many make it home, zone by zone across Alangilan campus.', visual: <RecoveryVisual items={items} /> },
    { id: 'engine', title: 'In-Browser CV Engine', eyebrow: 'Computer vision', accent: '#34D399', href: href('scanner'), cta: 'Run it on your photo',
      description: 'Feature extraction runs on a canvas in your tab. Photos never leave the device unless the FastAPI backend is running.', visual: <EngineVisual /> },
    { id: 'inventory', title: 'Inventory Scanner', eyebrow: 'Found items', accent: '#F59E0B', href: href('inventory'), cta: 'Open the inventory',
      description: 'Every reported item is indexed the moment it is logged, filterable by building, status and category.', visual: <InventoryVisual items={items} /> },
  ]

  return (
    <section className="mt-24">
      <div className="overflow-hidden rounded-[32px] bg-ink p-4 text-white sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TILES.map((t) => (
            <div key={t.big} className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl p-3 text-center ring-1 ring-white/5 ${t.tone}`}>
              <t.icon size={22} className="opacity-80" />
              <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{t.big}</p>
              <p className="text-xs font-medium text-white/70">{t.small}</p>
            </div>
          ))}
        </div>
        <div className="px-2 pb-6 pt-14 text-center sm:pt-20">
          <h2 className="mx-auto max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">Lost things, found by what they look like.</h2>
          <p className="mx-auto mt-5 max-w-xl text-white/60">Four parts of BalikBagay, stacked. Scroll to flip through them.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={href('scanner')} className="btn bg-white text-ink hover:bg-white/90">Open Smart Scanner <ArrowRight size={15} /></a>
            <a href={href('inventory')} className="btn border border-white/20 text-white hover:bg-white/10">Found Inventory</a>
          </div>
        </div>
      </div>
      <ScrollStackingCards cards={cards} className="mt-10" />
    </section>
  )
}

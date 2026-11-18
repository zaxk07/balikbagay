import { ArrowRight, BarChart3, Eye, MapPin, ShieldCheck, TextSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ItemThumb } from '../components/bits'
import { DEMOS } from '../data/seed'
import { presetPhoto } from '../lib/imaging'
import { featuresFromSrc, pct, rankLocal } from '../lib/matcher'
import type { MatchResult } from '../lib/types'
import { href } from '../router'
import { useItems } from '../store'

const FEATURES = [
  { icon: Eye, title: 'Visual feature matching', body: 'HSV color histograms, edge density and silhouette shape are extracted from the photo, so a black tumbler finds black tumblers first.' },
  { icon: TextSearch, title: 'Semantic text search', body: 'TF-IDF vectors with cosine similarity understand that "flask", "Aquaflask" and "tumbler" describe the same thing.' },
  { icon: BarChart3, title: 'Explainable confidence', body: 'Every result shows overall, visual and text scores plus the exact attributes that matched. No black box.' },
  { icon: ShieldCheck, title: 'Verified claims', body: 'Owners prove an identifying detail before an item is released, and claimed items drop out of future matches.' },
]

export default function Home() {
  const { items } = useItems()
  const [top, setTop] = useState<{ photo: string; result: MatchResult } | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const demo = DEMOS[0]
      const src = items.find((i) => i.id === demo.preset)
      if (!src) return
      const photo = await presetPhoto(src, 1)
      const image = await featuresFromSrc(photo)
      const [result] = await rankLocal(items, { description: demo.description, location: demo.location, category: demo.category, image }, 1)
      if (alive && result) setTop({ photo, result })
    })()
    return () => {
      alive = false
    }
  }, [items])

  return (
    <>
      <section className="grid items-center gap-12 pt-4 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="rise mb-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-brand">
            <MapPin size={14} /> BatStateU · Alangilan Campus
          </p>
          <h1 className="rise text-5xl font-semibold leading-[1.02] sm:text-6xl" style={{ ['--i' as string]: 1 }}>
            Reunite lost campus items using visual feature matching and semantic search.
          </h1>
          <p className="rise mt-6 max-w-xl text-lg text-muted" style={{ ['--i' as string]: 2 }}>
            Snap a photo or describe what you lost. BalikBagay compares it against every item the campus has found and ranks the likeliest matches, with the reasoning shown.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--i' as string]: 3 }}>
            <a href={href('scanner')} className="btn-primary">Open Smart Scanner <ArrowRight size={16} /></a>
            <a href={href('report')} className="btn-ghost">I found something</a>
          </div>
        </div>

        <div className="rise relative" style={{ ['--i' as string]: 2 }} aria-label="Live match preview">
          <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_24px_48px_-28px_rgba(29,26,23,0.4)]">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">Live match · computed in your browser</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <div className="aspect-square overflow-hidden rounded-xl border border-line bg-paper">
                  {top ? <img src={top.photo} alt="Query photo" className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-line/60" />}
                </div>
                <p className="mt-2 text-xs text-muted">Your photo</p>
              </div>
              <ArrowRight className="text-brand" size={20} />
              <div>
                <div className="aspect-square overflow-hidden rounded-xl border border-line bg-paper">
                  {top ? <ItemThumb item={top.result.item} /> : <div className="h-full w-full animate-pulse bg-line/60" />}
                </div>
                <p className="mt-2 truncate text-xs text-muted">{top ? top.result.item.title : 'Searching…'}</p>
              </div>
            </div>
            {top && (
              <div className="pop mt-4 flex items-end justify-between border-t border-line pt-4">
                <div>
                  <p className="font-display text-5xl font-semibold leading-none tabular-nums text-brand">{pct(top.result.overall)}%</p>
                  <p className="mt-1 text-xs text-muted">overall confidence</p>
                </div>
                <div className="text-right font-mono text-xs text-muted">
                  <p>visual {pct(top.result.visual)}%</p>
                  <p>text {pct(top.result.text)}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-brand">One-click demos</p>
            <h2 className="text-3xl font-semibold">Try a sample match</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((d, i) => {
            const src = items.find((it) => it.id === d.preset)
            return (
              <a key={d.id} href={href('scanner', { demo: d.id })} className="rise lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-card" style={{ ['--i' as string]: i }}>
                {src && <ItemThumb item={src} className="border-b border-line" />}
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-semibold leading-snug">{d.label}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><MapPin size={13} />{d.place}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">Run match <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" /></span>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="mb-6 text-3xl font-semibold">Built to be trusted</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rise rounded-2xl border border-line bg-card p-5" style={{ ['--i' as string]: i }}>
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={20} /></span>
              <h3 className="text-lg font-semibold leading-snug">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

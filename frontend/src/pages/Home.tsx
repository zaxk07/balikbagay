import { ArrowRight, BadgeCheck, Eye, FileSearch, Layers, MapPin, ShieldCheck, Sigma, TextSearch } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ItemThumb } from '../components/bits'
import { Accordion, CountUp, Reveal } from '../components/motion'
import { Showcase } from '../components/showcase'
import { ScanOverlay, SpotlightCard } from '../components/ui'
import { DEMOS, type DemoQuery } from '../data/seed'
import { presetPhoto } from '../lib/imaging'
import { featuresFromSrc, itemDoc, queryDoc, rankLocal } from '../lib/matcher'
import { buildModel, explain } from '../lib/text'
import { BUILDINGS, type Features, type Item, type MatchResult } from '../lib/types'
import { hueBins } from '../lib/vision'
import { href } from '../router'
import { useItems } from '../store'

const WORKBENCH = DEMOS.slice(0, 3)

interface Bundle {
  photo: string
  feat: Features
  results: MatchResult[]
  terms: { token: string; weight: number }[]
}

const hueColor = (i: number) => (i === 0 ? '#64748b' : `hsl(${(i / 16) * 360} 72% 52%)`)

function useBundles(items: Item[]): Record<string, Bundle> {
  const [bundles, setBundles] = useState<Record<string, Bundle>>({})
  const key = items.map((i) => i.id + i.status).join()
  useEffect(() => {
    let alive = true
    void (async () => {
      const model = buildModel(items.map(itemDoc))
      const next: Record<string, Bundle> = {}
      for (const [n, d] of WORKBENCH.entries()) {
        const src = items.find((i) => i.id === d.preset)
        if (!src) continue
        const photo = await presetPhoto(src, n + 1)
        const feat = await featuresFromSrc(photo)
        const results = await rankLocal(items, { description: d.description, location: d.location, category: d.category, image: feat }, 3)
        const idx = items.findIndex((i) => i.id === results[0]?.item.id)
        const terms = idx >= 0 ? explain(model, queryDoc(d), idx, 5) : []
        next[d.id] = { photo, feat, results, terms }
      }
      if (alive) setBundles(next)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return bundles
}

function HueStrip({ feat, tall = false }: { feat: Features; tall?: boolean }) {
  const bins = hueBins(feat)
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img" aria-label="HSV hue distribution">
        {bins.map((v, i) => v > 0.004 && <div key={i} className="h-full transition-[flex-grow] duration-500" style={{ flexGrow: v, background: hueColor(i) }} />)}
      </div>
      <div className={`mt-2 flex items-end gap-0.5 ${tall ? 'h-14' : 'h-8'}`}>
        {bins.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm transition-[height] duration-500" style={{ height: `${Math.max(4, Math.min(100, v * 100 * (i === 0 ? 1 : 2.4)))}%`, background: hueColor(i) }} title={`H${i}: ${(v * 100).toFixed(1)}%`} />
        ))}
      </div>
    </div>
  )
}

function Workbench({ active, setActive, bundles }: { active: DemoQuery; setActive: (d: DemoQuery) => void; bundles: Record<string, Bundle> }) {
  const b = bundles[active.id]
  const top = b?.results[0]
  return (
    <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_80px_-30px_rgba(15,41,34,0.6)] ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div role="tablist" aria-label="Sample queries" className="flex gap-1 overflow-x-auto rounded-full bg-white/5 p-1 [scrollbar-width:none]">
          {WORKBENCH.map((d) => (
            <button key={d.id} role="tab" aria-selected={active.id === d.id} onClick={() => setActive(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.96] sm:text-sm ${active.id === d.id ? 'bg-white text-ink' : 'text-white/65 hover:text-white'}`}>
              {d.label}{active.id === d.id && <span className="font-normal opacity-60"> · {d.place}</span>}
            </button>
          ))}
        </div>
        <span className="hidden items-center gap-1.5 font-mono text-[11px] text-ok md:inline-flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />live</span>
      </div>

      {!b || !top ? (
        <div className="grid h-[440px] place-items-center text-sm text-white/50">Running the extractor…</div>
      ) : (
        <div key={active.id} className="pop grid gap-5 p-4 sm:p-5 md:grid-cols-[210px_1fr]">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <img src={b.photo} alt={`Query photo: ${active.label}`} className="h-full w-full object-cover" />
              <ScanOverlay label="HSV · Sobel" />
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-white/45">HSV hue bins</p>
            <div className="mt-2"><HueStrip feat={b.feat} /></div>
            <p className="mt-2 font-mono text-[11px] text-white/50">edge {(b.feat.edge * 100).toFixed(0)}% · aspect {b.feat.aspect.toFixed(2)}</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-semibold text-ok"><BadgeCheck size={12} /> Best match</p>
                <h3 className="mt-2 truncate font-display text-xl font-semibold">{top.item.title}</h3>
                <p className="flex items-center gap-1 text-sm text-white/55"><MapPin size={13} />{top.item.building} · {top.item.spot}</p>
              </div>
              <p className="shrink-0 font-mono text-5xl font-medium leading-none text-cv">
                <CountUp value={top.overall * 100} /><span className="text-2xl">%</span>
              </p>
            </div>

            <div className="mt-4 space-y-2.5 font-mono text-xs">
              {[['visual', top.visual, 'bg-ok'], ['text cos', top.text, 'bg-cv']].map(([k, v, c]) => (
                <div key={k as string} className="flex items-center gap-3">
                  <span className="w-16 text-white/55">{k as string}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`bar h-full rounded-full ${c as string}`} style={{ width: `${(v as number) * 100}%` }} /></div>
                  <span className="w-12 text-right tabular-nums">{(v as number).toFixed(2)}</span>
                </div>
              ))}
              <p className="pt-1 text-white/45">0.55 × {top.visual.toFixed(2)} + 0.45 × {top.text.toFixed(2)} = <span className="text-white">{top.overall.toFixed(2)}</span></p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/45">TF-IDF term weights</p>
                <ul className="space-y-1 font-mono text-xs">
                  {b.terms.map((t) => (
                    <li key={t.token} className="flex items-center gap-2"><span className="w-20 truncate text-white/80">{t.token}</span>
                      <span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-full rounded-full bg-cv" style={{ width: `${Math.min(100, (t.weight / (b.terms[0]?.weight || 1)) * 100)}%` }} /></span>
                      <span className="w-10 text-right tabular-nums text-white/55">{t.weight.toFixed(2)}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/45">Ranked candidates</p>
                <ol className="space-y-1.5">
                  {b.results.map((r, i) => (
                    <li key={r.item.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-1.5">
                      <ItemThumb item={r.item} className="!w-8 rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-xs">{i + 1}. {r.item.title}</span>
                      <span className="font-mono text-xs tabular-nums text-white/70">{Math.round(r.overall * 100)}%</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a href={href('scanner', { demo: active.id })} className="btn bg-white text-ink hover:bg-white/90">Open in Scanner <ArrowRight size={15} /></a>
              <a href={href('inventory', { q: top.item.title })} className="btn border border-white/20 text-white hover:bg-white/10">View in Inventory</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Pipeline({ active, bundle }: { active: DemoQuery; bundle?: Bundle }) {
  const top = bundle?.results[0]
  const steps = [
    { icon: Eye, title: 'Extract', sub: 'canvas · HSV · Sobel', body: 'The photo is masked from its background and reduced to a 256-bin HSV histogram, an edge grid and a silhouette ratio.',
      viz: bundle ? <div className="rounded-xl bg-ink p-3"><HueStrip feat={bundle.feat} /></div> : null },
    { icon: TextSearch, title: 'Vectorize', sub: 'TF-IDF · cosine', body: 'Your description is tokenized, normalized with campus synonyms and weighted so rare words count for more.',
      viz: bundle ? <ul className="space-y-1 rounded-xl bg-paper p-3 font-mono text-xs">{bundle.terms.slice(0, 4).map((t) => <li key={t.token} className="flex justify-between"><span>{t.token}</span><span className="text-cv-ink">{t.weight.toFixed(2)}</span></li>)}</ul> : null },
    { icon: Sigma, title: 'Fuse', sub: '0.55 · V + 0.45 · T', body: 'Both scores are blended into one confidence, and every part of the sum stays visible so staff can audit it.',
      viz: top ? <div className="rounded-xl bg-paper p-3 font-mono text-xs"><p className="text-muted">0.55 × {top.visual.toFixed(2)} + 0.45 × {top.text.toFixed(2)}</p><p className="mt-1 text-3xl font-medium text-cv-ink"><CountUp value={top.overall * 100} suffix="%" /></p></div> : null },
  ]
  return (
    <div className="relative grid gap-4 md:grid-cols-3">
      <div aria-hidden className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent md:block" />
      {steps.map((s, i) => (
        <Reveal key={s.title} i={i} className="h-full">
          <div className="relative h-full rounded-3xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="relative z-10 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white"><s.icon size={20} /></span>
              <div><p className="font-mono text-[11px] text-cv-ink">0{i + 1} · {s.sub}</p><h3 className="font-display text-xl font-semibold">{s.title}</h3></div>
            </div>
            <p className="mb-4 text-sm text-muted">{s.body}</p>
            {s.viz ?? <div className="h-20 animate-pulse rounded-xl bg-paper" />}
            <p className="mt-3 text-xs text-muted">Live for: <span className="font-semibold text-ink">{active.label}</span></p>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

function Recovery({ items }: { items: Item[] }) {
  const [zone, setZone] = useState<string>('CICS')
  const stats = useMemo(
    () => BUILDINGS.map((b) => {
      const list = items.filter((i) => i.building === b)
      const claimed = list.filter((i) => i.status === 'Claimed').length
      return { b, list, claimed, open: list.length - claimed, rate: list.length ? claimed / list.length : 0 }
    }),
    [items],
  )
  const max = Math.max(...stats.map((s) => s.list.length), 1)
  const cur = stats.find((s) => s.b === zone)!
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-3xl border border-line bg-white p-3" role="tablist" aria-label="Campus zones">
        {stats.map((s) => (
          <button key={s.b} role="tab" aria-selected={zone === s.b} onClick={() => setZone(s.b)}
            className={`group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors ${zone === s.b ? 'bg-brand-soft' : 'hover:bg-paper'}`}>
            <span className="w-24 shrink-0 font-display text-base font-semibold">{s.b}</span>
            <span className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
              <span className="h-full bg-ok transition-[width] duration-500" style={{ width: `${(s.claimed / max) * 100}%` }} />
              <span className="h-full bg-cv transition-[width] duration-500" style={{ width: `${(s.open / max) * 100}%` }} />
            </span>
            <span className="w-24 shrink-0 text-right font-mono text-xs text-muted"><b className="text-ink">{s.claimed}</b> / {s.list.length} home</span>
          </button>
        ))}
        <p className="flex gap-4 px-3 pb-1 pt-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ok" />Returned</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cv" />Still waiting</span></p>
      </div>

      <div key={zone} className="pop rounded-3xl bg-ink p-6 text-white">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/45">Recovery rate · {zone}</p>
        <p className="mt-1 font-mono text-6xl font-medium text-cv"><CountUp value={cur.rate * 100} suffix="%" /></p>
        <p className="mt-1 text-sm text-white/60">{cur.claimed} of {cur.list.length} logged items have been returned to their owners.</p>
        <ul className="mt-5 space-y-2">
          {cur.list.slice(0, 4).map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
              <ItemThumb item={i} className="!w-10 rounded-lg" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{i.title}</span><span className="text-xs text-white/50">{i.spot}</span></span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.status === 'Claimed' ? 'bg-ok/20 text-ok' : 'bg-cv/20 text-cv'}`}>{i.status}</span>
            </li>
          ))}
        </ul>
        <a href={href('inventory', { building: zone })} className="btn mt-5 bg-white text-ink hover:bg-white/90">Browse {zone} items <ArrowRight size={15} /></a>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Eye, title: 'Visual feature matching', body: 'A black tumbler finds black tumblers first.', more: 'HSV histograms ignore lighting, Sobel edges capture texture and a silhouette ratio separates a tall flask from a flat notebook.', span: 'md:col-span-4' },
  { icon: TextSearch, title: 'Semantic search', body: 'Flask, Aquaflask, tumbler: one meaning.', more: 'A campus synonym list feeds TF-IDF so wording stops mattering.', span: 'md:col-span-2' },
  { icon: Layers, title: 'Explainable score', body: 'No black box.', more: 'Every percentage is shown with its parts and matched terms.', span: 'md:col-span-2' },
  { icon: ShieldCheck, title: 'Verified claims', body: 'Owners prove a detail only they know.', more: 'Claims go through a verification form and claimed items leave future matches, so nothing is handed over on a guess.', span: 'md:col-span-4' },
]

const FAQ = [
  { q: 'Do I need to upload my photo to a server?', a: 'No. The canvas extractor and the TF-IDF matcher run entirely in your browser. If you start the optional FastAPI backend on localhost:8000, BalikBagay detects it and switches to the OpenCV and scikit-learn engine automatically.' },
  { q: 'What if I only remember a description, or only have a photo?', a: 'Either works. With one signal the score uses that signal alone and the result is labeled visual-only or text-only. With both, the hybrid score is 0.55 × visual + 0.45 × text.' },
  { q: 'How does BalikBagay avoid handing items to the wrong person?', a: 'Matching only ranks candidates. To claim, you submit your SR-Code and describe a detail that was left out of the public listing, and staff compare it with the physical item before release.' },
  { q: 'I found something. How fast does it become searchable?', a: 'Immediately. Reporting an item stores it in your browser and adds it to the scanner index the moment you submit the form.' },
  { q: 'Which campus areas are covered?', a: 'CICS, CEA, CIT, the Library, the Gymnasium and the Cafeteria at BatStateU Alangilan.' },
]

export default function Home() {
  const { items } = useItems()
  const bundles = useBundles(items)
  const [active, setActive] = useState<DemoQuery>(WORKBENCH[0])
  const claimed = items.filter((i) => i.status === 'Claimed').length

  return (
    <>
      <section className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.3fr]">
        <div className="rise">
          <p className="badge-cv mb-5"><MapPin size={12} /> BatStateU · Alangilan Campus</p>
          <h1 className="text-4xl font-semibold leading-[1.04] sm:text-5xl xl:text-[3.3rem]">
            Reunite lost campus items using <span className="text-ok-ink">visual feature matching</span> and semantic search.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">Pick a sample on the right and watch the real matcher run. Every number is computed live in your browser.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={href('scanner')} className="btn-primary">Open Smart Scanner <ArrowRight size={16} /></a>
            <a href={href('report')} className="btn-ghost">I found something</a>
          </div>
        </div>
        <div className="rise min-w-0" style={{ ['--i' as string]: 2 }}>
          <Workbench active={active} setActive={setActive} bundles={bundles} />
        </div>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {[['Items logged', items.length], ['Waiting for owners', items.length - claimed], ['Returned home', claimed], ['Campus zones', BUILDINGS.length]].map(([l, v], i) => (
          <Reveal key={l as string} i={i} className="bg-white p-6">
            <p className="font-mono text-4xl font-medium text-ink"><CountUp value={v as number} /></p>
            <p className="mt-1 text-sm text-muted">{l as string}</p>
          </Reveal>
        ))}
      </section>

      <section className="mt-24">
        <Reveal><p className="badge-cv mb-3"><FileSearch size={12} /> The pipeline</p><h2 className="mb-8 max-w-2xl text-3xl font-semibold sm:text-4xl">Three steps from a blurry photo to a ranked answer.</h2></Reveal>
        <Pipeline active={active} bundle={bundles[active.id]} />
      </section>

      <Showcase />

      <section className="mt-24">
        <Reveal><p className="badge-cv mb-3"><MapPin size={12} /> Campus recovery</p><h2 className="mb-8 max-w-2xl text-3xl font-semibold sm:text-4xl">Where things are lost, and where they get home.</h2></Reveal>
        <Reveal><Recovery items={items} /></Reveal>
      </section>

      <section className="mt-24">
        <Reveal><h2 className="mb-8 max-w-2xl text-3xl font-semibold sm:text-4xl">Built to be trusted, not just fast.</h2></Reveal>
        <div className="grid gap-4 md:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} i={i} className={f.span}>
              <SpotlightCard className="group h-full p-6">
                <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-ink"><f.icon size={20} /></span>
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-1 text-muted">{f.body}</p>
                <p className="mt-3 max-h-none text-sm text-muted opacity-100 transition-[opacity,transform] duration-300 md:max-h-0 md:translate-y-2 md:overflow-hidden md:opacity-0 md:group-hover:max-h-40 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:max-h-40 md:group-focus-within:opacity-100" tabIndex={0}>{f.more}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal><p className="badge-cv mb-3">FAQ</p><h2 className="text-3xl font-semibold sm:text-4xl">Questions people ask before they trust a matcher.</h2></Reveal>
        <Reveal i={1}><Accordion items={FAQ.map((f) => ({ q: f.q, a: f.a }))} /></Reveal>
      </section>

      <Reveal className="mt-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div><h2 className="text-3xl font-semibold">Lost something this week?</h2><p className="mt-2 text-white/60">It takes one photo to check everything the campus has found.</p></div>
          <a href={href('scanner')} className="btn bg-white text-ink hover:bg-white/90">Start scanning <ArrowRight size={16} /></a>
        </div>
      </Reveal>
    </>
  )
}

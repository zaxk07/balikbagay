import { Blend, Grid3x3, Palette, Type } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ItemThumb } from '../components/bits'
import { PageHead } from '../components/Shell'
import { getItemFeatures, pct } from '../lib/matcher'
import { tokenize } from '../lib/text'
import type { Features } from '../lib/types'
import { useItems } from '../store'

const SAMPLE = 'Lost my black Aquaflask with a dent near the bottom, left at the CICS building'

function Step({ n, icon, title, children, viz }: { n: number; icon: ReactNode; title: string; children: ReactNode; viz: ReactNode }) {
  return (
    <article className="rise grid gap-6 surface p-6 md:grid-cols-[1fr_320px]" style={{ ['--i' as string]: n }}>
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cv text-white">{icon}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-cv-ink">Step {n}</span>
        </div>
        <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
        <div className="space-y-3 text-muted [&_code]:rounded [&_code]:bg-paper [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink">{children}</div>
      </div>
      <div className="rounded-xl border border-line bg-paper p-4">{viz}</div>
    </article>
  )
}

export default function HowItWorks() {
  const { items } = useItems()
  const seeds = items.filter((i) => !i.reported)
  const [id, setId] = useState('bb-009')
  const item = seeds.find((i) => i.id === id) ?? seeds[0]
  const [feat, setFeat] = useState<Features | null>(null)

  useEffect(() => {
    let alive = true
    void getItemFeatures(item).then((f) => alive && setFeat(f))
    return () => {
      alive = false
    }
  }, [item])

  // collapse the 256-bin histogram to 16 hue bins (bin 0 also holds achromatic pixels)
  const hue = useMemo(() => {
    if (!feat) return new Array<number>(16).fill(0)
    const out = new Array<number>(16).fill(0)
    feat.hist.forEach((v, i) => (out[Math.floor(i / 16)] += v))
    return out
  }, [feat])
  const maxHue = Math.max(...hue.slice(1), 0.001) // bin 0 also holds all neutral (black/white/gray) pixels, so scale the chroma bins on their own
  const tokens = tokenize(SAMPLE)

  return (
    <>
      <PageHead eyebrow="How It Works" title="Two signals, one explainable score.">
        Every match fuses what an item looks like with how it is described. Pick an item to watch the real extractor run on it.
      </PageHead>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="pick" className="label !mb-0">Inspect</label>
        <select id="pick" className="field !w-auto" value={item.id} onChange={(e) => setId(e.target.value)}>
          {seeds.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </div>

      <div className="space-y-5">
        <Step n={1} icon={<Palette size={18} />} title="HSV color histogram"
          viz={<div className="flex gap-3"><div className="w-24 shrink-0"><ItemThumb item={item} className="rounded-lg border border-line" /></div>
            <div className="flex h-24 flex-1 items-end gap-0.5" role="img" aria-label="Hue histogram">
              {hue.map((v, i) => <div key={i} className="flex-1 rounded-t-sm transition-[height] duration-300" style={{ height: `${Math.min(100, Math.max(3, (v / maxHue) * 100))}%`, background: i === 0 && v > 0 ? '#94a3b8' : `hsl(${(i / 16) * 360} 70% 50%)` }} />)}
            </div></div>}>
          <p>The background is estimated from the photo border and masked out. Remaining pixels are converted from RGB to HSV and counted into <code>16 × 4 × 4</code> bins of hue, saturation and value.</p>
          <p>HSV separates color from lighting, so a tumbler in a bright hallway still matches the same tumbler in shade. Histograms are compared by intersection.</p>
          {feat && <p className="font-mono text-xs">first bar = neutral pixels · dominant: {feat.colors.join(', ') || 'n/a'}</p>}
        </Step>

        <Step n={2} icon={<Grid3x3 size={18} />} title="Edge density and shape"
          viz={<div><div className="grid grid-cols-4 gap-1">
            {(feat?.grid ?? new Array(16).fill(0)).map((v, i) => <div key={i} className="aspect-square rounded-sm bg-cv transition-opacity duration-300" style={{ opacity: Math.max(0.06, Math.min(1, v * 3)) }} />)}
          </div>
            <p className="mt-3 font-mono text-[11px] text-muted">edge density {feat ? pct(feat.edge) : 0}% · aspect {feat?.aspect.toFixed(2)} · fill {feat ? pct(feat.fill) : 0}%</p></div>}>
          <p>A Sobel filter finds contours. The share of edge pixels and a <code>4 × 4</code> spatial map capture texture and layout: a calculator is dense with buttons, an umbrella is a smooth taper.</p>
          <p>The foreground bounding box gives an aspect ratio and fill ratio, a lightweight silhouette descriptor. The backend uses Canny and contours via OpenCV.</p>
        </Step>

        <Step n={3} icon={<Type size={18} />} title="TF-IDF text vectorization"
          viz={<div><p className="mb-2 text-xs text-muted">"{SAMPLE}"</p>
            <div className="flex flex-wrap gap-1.5">{tokens.map((t, i) => <span key={i} className="rounded-md border border-line bg-card px-2 py-0.5 font-mono text-xs">{t}</span>)}</div></div>}>
          <p>Descriptions are lowercased, stripped of stop words, lightly stemmed and normalized through a campus synonym list, so <code>Aquaflask</code>, <code>flask</code> and <code>bottle</code> all become <code>tumbler</code>.</p>
          <p>Terms are weighted by <code>(1 + ln tf) × idf</code>, rare words like "dent" count for more than "black". Query and item vectors are compared with cosine similarity.</p>
        </Step>

        <Step n={4} icon={<Blend size={18} />} title="Weighted fusion"
          viz={<div className="space-y-2 font-mono text-sm"><p className="rounded-xl bg-ink p-3 text-white">score = 0.55 · V + 0.45 · T</p>
            <p className="text-xs text-muted">V = 0.60 color + 0.25 edges + 0.15 shape</p>
            <p className="text-xs text-muted">T = cosine(tfidf(query), tfidf(item))</p></div>}>
          <p>Visual evidence carries slightly more weight than text, because people describe things inconsistently but a photo is hard to argue with. When only one signal is supplied, its score is used directly and the result is labeled <code>visual-only</code> or <code>text-only</code>.</p>
          <p>Each result shows the overall, visual and text percentages plus the shared attributes, so staff and owners can see exactly why an item ranked.</p>
        </Step>
      </div>
    </>
  )
}

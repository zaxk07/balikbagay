import { ImagePlus, Loader2, ScanSearch, Trash2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { ItemThumb, Meter, TagChip } from '../components/bits'
import { PageHead } from '../components/Shell'
import { DEMOS } from '../data/seed'
import { remoteMatch } from '../lib/api'
import { downscale, presetPhoto, readFileAsDataUri } from '../lib/imaging'
import { featuresFromSrc, pct, rankLocal } from '../lib/matcher'
import { BUILDINGS, CATEGORIES, type MatchResult } from '../lib/types'
import { href, type Route } from '../router'
import { useItems } from '../store'

function verdict(p: number) {
  if (p >= 70) return { text: 'Strong match', cls: 'text-ok' }
  if (p >= 45) return { text: 'Possible match', cls: 'text-brand-dark' }
  return { text: 'Weak match', cls: 'text-muted' }
}

export default function Scanner({ route }: { route: Route }) {
  const { items, backendOnline } = useItems()
  const [image, setImage] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [engine, setEngine] = useState<'browser' | 'fastapi'>('browser')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [presets, setPresets] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    void Promise.all(
      DEMOS.map(async (d, i) => {
        const it = items.find((x) => x.id === d.preset)
        return it ? ([d.id, await presetPhoto(it, i)] as const) : null
      }),
    ).then((entries) => {
      if (alive) setPresets(Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null)))
    })
    return () => {
      alive = false
    }
    // seed items are static; avoid regenerating when user reports change `items`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = useCallback(
    async (q: { image: string | null; description: string; location: string; category: string }) => {
      setBusy(true)
      setError('')
      try {
        if (!q.image && !q.description.trim() && !q.location && !q.category) {
          setError('Add a photo or describe the item first.')
          setResults(null)
          return
        }
        if (backendOnline) {
          try {
            setResults(await remoteMatch(items, { ...q, imageSrc: q.image }))
            setEngine('fastapi')
            return
          } catch {
            /* fall through to the in-browser engine */
          }
        }
        const feats = q.image ? await featuresFromSrc(q.image) : null
        setResults(await rankLocal(items, { description: q.description, location: q.location, category: q.category, image: feats }))
        setEngine('browser')
      } catch {
        setError('Something went wrong reading that image. Try a different photo.')
      } finally {
        setBusy(false)
      }
    },
    [items, backendOnline],
  )

  // One-click demo from the home page (#/scanner?demo=tumbler)
  const demoId = route.params.get('demo')
  const ranDemo = useRef<string | null>(null)
  useEffect(() => {
    if (!demoId || ranDemo.current === demoId || !presets[demoId]) return
    const d = DEMOS.find((x) => x.id === demoId)
    if (!d) return
    ranDemo.current = demoId
    setImage(presets[demoId]); setDescription(d.description); setLocation(d.location); setCategory(d.category)
    void run({ image: presets[demoId], description: d.description, location: d.location, category: d.category })
  }, [demoId, presets, run])

  const accept = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).')
      return
    }
    setError('')
    setImage(await downscale(await readFileAsDataUri(file), 320))
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void accept(e.dataTransfer.files[0])
  }
  const usePreset = (id: string) => {
    const d = DEMOS.find((x) => x.id === id)!
    setImage(presets[id]); setDescription(d.description); setLocation(d.location); setCategory(d.category)
    void run({ image: presets[id], description: d.description, location: d.location, category: d.category })
  }

  return (
    <>
      <PageHead eyebrow="Smart Scanner" title="Show us what you lost.">
        Upload a photo, describe it, or both. Photo plus description gives the strongest ranking.
      </PageHead>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <form
          className="space-y-5 self-start rounded-2xl border border-line bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault()
            void run({ image, description, location, category })
          }}
        >
          <div>
            <span className="label">Photo</span>
            {image ? (
              <div className="pop relative overflow-hidden rounded-xl border border-line">
                <img src={image} alt="Your uploaded item" className="aspect-square w-full object-cover" />
                <button type="button" onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-lg bg-ink/80 p-2 text-paper hover:bg-ink" aria-label="Remove photo">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${dragging ? 'border-brand bg-brand-soft' : 'border-line bg-paper hover:border-ink/40'}`}
              >
                <UploadCloud className="text-brand" size={28} />
                <span className="text-sm font-semibold">Drop a photo here, or click to browse</span>
                <span className="text-xs text-muted">Processed locally. Nothing leaves your device unless FastAPI is running.</span>
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { void accept(e.target.files?.[0]); e.target.value = '' }} />
          </div>

          <div>
            <span className="label">Or try a test photo</span>
            <div className="grid grid-cols-4 gap-2">
              {DEMOS.map((d) => (
                <button key={d.id} type="button" onClick={() => presets[d.id] && usePreset(d.id)} className="group overflow-hidden rounded-lg border border-line bg-paper text-left transition-transform duration-150 active:scale-[0.97] hover:border-brand" title={d.label} disabled={!presets[d.id]}>
                  {presets[d.id] ? <img src={presets[d.id]} alt={d.label} className="aspect-square w-full object-cover" /> : <div className="aspect-square animate-pulse bg-line/60" />}
                  <span className="block truncate px-1.5 py-1 text-[10px] font-medium text-muted group-hover:text-ink">{d.label.split(' ').slice(-1)[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="desc">Description</label>
            <textarea id="desc" rows={3} className="field resize-none" placeholder="Color, brand, marks, what's inside…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="loc">Last seen</label>
              <select id="loc" className="field" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Anywhere</option>
                {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cat">Category</label>
              <select id="cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Any</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-brand-dark">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <ScanSearch size={16} />} Find matches
          </button>
        </form>

        <section aria-live="polite">
          {!results && !busy && (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-line p-8 text-center">
              <div>
                <ImagePlus className="mx-auto mb-3 text-muted" size={32} />
                <p className="font-display text-xl font-semibold">Ranked matches appear here</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Pick one of the test photos on the left to see the full pipeline in one click.</p>
              </div>
            </div>
          )}
          {results && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold">{results.length} candidates ranked</h2>
                <span className="chip font-mono">{engine === 'fastapi' ? 'FastAPI · OpenCV + scikit-learn' : 'In-browser · canvas + TF-IDF'} · {results[0]?.mode}</span>
              </div>
              <ol className="space-y-3">
                {results.map((r, i) => {
                  const p = pct(r.overall)
                  const v = verdict(p)
                  return (
                    <li key={r.item.id} className="rise grid gap-4 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[112px_1fr_auto]" style={{ ['--i' as string]: i }}>
                      <div className="relative">
                        <ItemThumb item={r.item} className="rounded-xl border border-line" />
                        <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink font-mono text-xs text-paper">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold leading-snug">{r.item.title}</h3>
                        <p className="text-sm text-muted">{r.item.building} · {r.item.spot}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Meter label="Visual similarity" value={r.visual} i={i} />
                          <Meter label="Text match" value={r.text} i={i} />
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-muted">
                          color {pct(r.breakdown.color)}% · edges {pct(r.breakdown.edge)}% · shape {pct(r.breakdown.shape)}%
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.tags.length ? r.tags.map((t) => <TagChip key={t.kind + t.label} tag={t} />) : <span className="text-xs text-muted">No shared attributes</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
                        <div className="text-right">
                          <p className={`font-display text-5xl font-semibold leading-none tabular-nums ${i === 0 ? 'text-brand' : ''}`}>{p}<span className="text-2xl">%</span></p>
                          <p className={`mt-1 text-xs font-semibold ${v.cls}`}>{v.text}</p>
                        </div>
                        <a href={href('inventory', { open: r.item.id })} className="btn-ghost !py-2">This is mine</a>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          )}
        </section>
      </div>
    </>
  )
}

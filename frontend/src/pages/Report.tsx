import { CheckCircle2, ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { PageHead } from '../components/Shell'
import { remoteReport } from '../lib/api'
import { downscale, readFileAsDataUri } from '../lib/imaging'
import { featuresFromSrc } from '../lib/matcher'
import { BUILDINGS, CATEGORIES, type Building, type Category, type Item, type Kind } from '../lib/types'
import { href } from '../router'
import { useItems } from '../store'

const KIND_BY_CATEGORY: Record<Category, Kind> = {
  Drinkware: 'tumbler', Electronics: 'charger', Stationery: 'notebook', Accessories: 'glasscase', Apparel: 'hoodie', Bags: 'tote', 'IDs & Keys': 'keys',
}
const today = () => new Date().toISOString().slice(0, 10)

export default function Report() {
  const { addItem, backendOnline } = useItems()
  const [photo, setPhoto] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Electronics')
  const [building, setBuilding] = useState<Building>('CICS')
  const [spot, setSpot] = useState('')
  const [date, setDate] = useState(today())
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Item | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    setError('')
    setPhoto(await downscale(await readFileAsDataUri(file), 320))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!photo) return setError('A photo is required so owners can be matched visually.')
    try {
      await featuresFromSrc(photo) // fail early on unreadable images
    } catch {
      return setError('That image could not be read. Try another one.')
    }
    const item: Item = {
      id: `bb-u${Date.now().toString(36)}`,
      title: title.trim(), category, building, spot: spot.trim() || 'Handed to the guard post', description: description.trim(),
      date, status: 'Unclaimed', kind: KIND_BY_CATEGORY[category], colors: ['#888', '#aaa', '#ccc'], image: photo, reported: true,
    }
    addItem(item)
    if (backendOnline) void remoteReport(item, photo).catch(() => undefined)
    setSaved(item)
  }

  const again = () => {
    setSaved(null); setPhoto(null); setTitle(''); setSpot(''); setDescription(''); setError('')
  }

  if (saved) {
    return (
      <div className="pop mx-auto max-w-xl rounded-2xl border border-line bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-ok" size={48} />
        <h1 className="text-3xl font-semibold">Logged. Thank you.</h1>
        <p className="mt-3 text-muted"><strong className="text-ink">{saved.title}</strong> is now in the inventory and searchable in the Smart Scanner immediately.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={href('scanner')} className="btn-primary">Try it in the Scanner</a>
          <a href={href('inventory')} className="btn-ghost">View inventory</a>
          <button onClick={again} className="btn-ghost">Report another</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHead eyebrow="Report Found Item" title="Found something? Log it in a minute.">
        A clear photo against a plain background gives the best matches. Avoid showing personal details like ID numbers.
      </PageHead>
      <form onSubmit={submit} className="grid max-w-4xl gap-8 rounded-2xl border border-line bg-card p-6 md:grid-cols-[260px_1fr]">
        <div>
          <span className="label">Photo</span>
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border border-line">
              <img src={photo} alt="Item preview" className="aspect-square w-full object-cover" />
              <button type="button" onClick={() => setPhoto(null)} className="absolute right-2 top-2 rounded-lg bg-ink/80 p-2 text-paper" aria-label="Remove photo"><Trash2 size={16} /></button>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files[0]) }}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper px-4 text-center hover:border-ink/40">
              <ImagePlus className="text-brand" size={28} /><span className="text-sm font-semibold">Add photo</span><span className="text-xs text-muted">Click or drop</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <div className="space-y-4">
          <div><label className="label" htmlFor="t">Item title</label><input id="t" required className="field" placeholder="e.g. Black umbrella with wooden handle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="c">Category</label><select id="c" className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label" htmlFor="b">Building found</label><select id="b" className="field" value={building} onChange={(e) => setBuilding(e.target.value as Building)}>{BUILDINGS.map((b) => <option key={b}>{b}</option>)}</select></div>
            <div><label className="label" htmlFor="s">Exact spot</label><input id="s" className="field" placeholder="Room, bench, table…" value={spot} onChange={(e) => setSpot(e.target.value)} /></div>
            <div><label className="label" htmlFor="d">Date found</label><input id="d" type="date" required max={today()} className="field" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div><label className="label" htmlFor="x">Description</label><textarea id="x" required rows={4} className="field resize-none" placeholder="Color, brand, size, condition, distinguishing marks. Leave out the one detail an owner would prove." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm font-medium text-brand-dark">{error}</p>}
          <button type="submit" className="btn-primary">Log found item</button>
        </div>
      </form>
    </>
  )
}

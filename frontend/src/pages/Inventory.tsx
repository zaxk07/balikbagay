import { CalendarDays, CheckCircle2, MapPin, PackageSearch, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ItemThumb, Modal, StatusPill } from '../components/bits'
import { PageHead } from '../components/Shell'
import { Meter } from '../components/bits'
import { PillTabs } from '../components/ui'
import { itemDoc } from '../lib/matcher'
import { buildModel, scoreQuery } from '../lib/text'
import { BUILDINGS, CATEGORIES, type Item } from '../lib/types'
import type { Route } from '../router'
import { useItems } from '../store'

const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

function ClaimModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const { claimItem } = useItems()
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [proof, setProof] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    claimItem(item.id, { name: name.trim(), studentId: studentId.trim(), at: new Date().toISOString() })
    setDone(true)
  }

  if (done) {
    return (
      <Modal title="Claim submitted" onClose={onClose}>
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 text-ok-ink" size={44} />
          <p className="text-muted">Present your student ID at the Alangilan Security Office to collect <strong className="text-ink">{item.title}</strong>. Staff will check your answer against the item.</p>
          <button className="btn-primary mt-6" onClick={onClose}>Done</button>
        </div>
      </Modal>
    )
  }
  return (
    <Modal title="Verify your claim" onClose={onClose}>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
        <ItemThumb item={item} className="!w-16 rounded-lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.title}</p>
          <p className="text-sm text-muted">{item.building} · {item.spot}</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="cn">Full name</label><input id="cn" required className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
          <div><label className="label" htmlFor="cs">SR-Code</label><input id="cs" required className="field" placeholder="26-12345" pattern="\d{2}-\d{5}" title="Format: 26-12345" value={studentId} onChange={(e) => setStudentId(e.target.value)} /></div>
        </div>
        <div>
          <label className="label" htmlFor="cp">Describe something only the owner would know</label>
          <textarea id="cp" required minLength={12} rows={3} className="field resize-none" placeholder="Marks, contents, wallpaper, stickers, serial number…" value={proof} onChange={(e) => setProof(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Not shown publicly. Staff compare it with the physical item before release.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Submit claim</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Inventory({ route }: { route: Route }) {
  const { items } = useItems()
  const [q, setQ] = useState(route.params.get('q') ?? '')
  const [building, setBuilding] = useState(route.params.get('building') ?? '')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState<string | null>(route.params.get('open'))

  useEffect(() => {
    setOpenId(route.params.get('open'))
    const rq = route.params.get('q')
    if (rq !== null) setQ(rq)
    const rb = route.params.get('building')
    if (rb !== null) setBuilding(rb)
  }, [route.params])

  const model = useMemo(() => buildModel(items.map(itemDoc)), [items])
  const filtered = useMemo(() => {
    const needle = q.trim()
    const { scores } = needle ? scoreQuery(model, needle) : { scores: [] as number[] }
    const rows = items
      .map((item, idx) => ({ item, score: needle ? scores[idx] : 0 }))
      .filter(
        ({ item: i, score }) =>
          (!building || i.building === building) &&
          (!category || i.category === category) &&
          (!status || i.status === status) &&
          (!needle || score > 0 || `${i.title} ${i.description}`.toLowerCase().includes(needle.toLowerCase())),
      )
    return needle ? rows.sort((a, b) => b.score - a.score) : rows
  }, [items, model, q, building, category, status])

  const claiming = items.find((i) => i.id === openId && i.status === 'Unclaimed')
  const close = () => {
    setOpenId(null)
    if (route.params.get('open')) history.replaceState(null, '', '#/inventory')
  }
  const reset = building || category || status || q

  return (
    <>
      <PageHead eyebrow="Found Inventory" title="Everything the campus has found.">
        {items.filter((i) => i.status === 'Unclaimed').length} items waiting for their owners.
      </PageHead>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input className="field !pl-10" placeholder="Search tumbler, charger, lanyard…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PillTabs label="Building" value={building} onChange={setBuilding} options={[{ value: '', label: 'All zones' }, ...BUILDINGS.map((b) => ({ value: b as string, label: b }))]} />
          <select className="field !w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <PillTabs label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any' }, { value: 'Unclaimed', label: 'Unclaimed' }, { value: 'Claimed', label: 'Claimed' }]} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <PackageSearch className="mb-3 text-muted" size={32} />
          <p className="font-display text-xl font-bold">Nothing matches those filters</p>
          {reset && <button className="btn-ghost mt-4" onClick={() => { setQ(''); setBuilding(''); setCategory(''); setStatus('') }}>Clear filters</button>}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({ item: i, score }, n) => (
            <li key={i.id} className={`rise lift surface flex flex-col overflow-hidden ${i.status === 'Claimed' ? 'opacity-70' : ''}`} style={{ ['--i' as string]: Math.min(n, 8) }}>
              <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-xl border border-line bg-[#eef2f7]">
                <ItemThumb item={i} className="!aspect-[4/3] !object-contain" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-line bg-white/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur"><MapPin size={11} className="text-brand" />{i.building}</span>
                <span className="absolute right-2 top-2"><StatusPill status={i.status} /></span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="chip self-start">{i.category}</span>
                <h3 className="mt-2 font-display font-bold leading-snug">{i.title}</h3>
                <p className="mt-1 text-sm text-muted">{i.spot}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><CalendarDays size={13} />Found {fmtDate(i.date)}{i.reported && ' · reported by you'}</p>
                {q.trim() && <div className="mt-3"><Meter label="Text match" value={score} i={n} strong={score > 0.4} /></div>}
                <button className="btn-ghost mt-4 !py-2" disabled={i.status === 'Claimed'} onClick={() => setOpenId(i.id)}>
                  {i.status === 'Claimed' ? 'Already claimed' : 'Claim this item'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {claiming && <ClaimModal item={claiming} onClose={close} />}
    </>
  )
}

import { CalendarDays, CheckCircle2, MapPin, PackageSearch, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ItemThumb, Modal, StatusPill } from '../components/bits'
import { PageHead } from '../components/Shell'
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
          <CheckCircle2 className="mx-auto mb-3 text-ok" size={44} />
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
  const [q, setQ] = useState('')
  const [building, setBuilding] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState<string | null>(route.params.get('open'))

  useEffect(() => setOpenId(route.params.get('open')), [route.params])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return items.filter(
      (i) =>
        (!building || i.building === building) &&
        (!category || i.category === category) &&
        (!status || i.status === status) &&
        (!needle || `${i.title} ${i.description} ${i.spot} ${i.building}`.toLowerCase().includes(needle)),
    )
  }, [items, q, building, category, status])

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

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-[1fr_repeat(3,170px)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input className="field !pl-9" placeholder="Search tumbler, charger, lanyard…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
          </div>
          <select className="field" value={building} onChange={(e) => setBuilding(e.target.value)} aria-label="Building"><option value="">All buildings</option>{BUILDINGS.map((b) => <option key={b}>{b}</option>)}</select>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Any status</option><option>Unclaimed</option><option>Claimed</option></select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <PackageSearch className="mb-3 text-muted" size={32} />
          <p className="font-display text-xl font-semibold">Nothing matches those filters</p>
          {reset && <button className="btn-ghost mt-4" onClick={() => { setQ(''); setBuilding(''); setCategory(''); setStatus('') }}>Clear filters</button>}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((i, n) => (
            <li key={i.id} className={`rise lift flex flex-col overflow-hidden rounded-2xl border border-line bg-card ${i.status === 'Claimed' ? 'opacity-70' : ''}`} style={{ ['--i' as string]: Math.min(n, 8) }}>
              <ItemThumb item={i} className="border-b border-line" />
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="chip">{i.category}</span><StatusPill status={i.status} />
                </div>
                <h3 className="mt-1 font-semibold leading-snug">{i.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin size={13} />{i.building} · {i.spot}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><CalendarDays size={13} />Found {fmtDate(i.date)}{i.reported && ' · reported by you'}</p>
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

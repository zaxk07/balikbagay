import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { pct } from '../lib/matcher'
import { itemImage } from '../lib/thumbs'
import type { Item, Tag } from '../lib/types'

export function ItemThumb({ item, className = '' }: { item: Item; className?: string }) {
  return <img src={itemImage(item)} alt={item.title} loading="lazy" className={`aspect-square w-full object-cover ${className}`} />
}

export function StatusPill({ status }: { status: Item['status'] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status === 'Unclaimed' ? 'bg-brand-soft text-brand-dark' : 'bg-ink/10 text-muted'}`}>
      {status}
    </span>
  )
}

const TAG_STYLE: Record<Tag['kind'], string> = {
  color: 'border-brand/30 bg-brand-soft text-brand-dark',
  place: 'border-ok/30 bg-ok/10 text-ok',
  category: 'border-ink/20 bg-ink/5 text-ink',
  keyword: 'border-line bg-paper text-muted',
}

export function TagChip({ tag }: { tag: Tag }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${TAG_STYLE[tag.kind]}`}>{tag.label}</span>
}

export function Meter({ label, value, i = 0, strong = false }: { label: string; value: number; i?: number; strong?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono font-medium tabular-nums">{pct(value)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`bar h-full rounded-full ${strong ? 'bg-brand' : 'bg-ink/70'}`} style={{ width: `${pct(value)}%`, ['--i' as string]: i }} />
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', on)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="pop w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

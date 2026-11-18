import { useRef, useState, type ReactNode } from 'react'

/** Adapted from 21st.dev "Spotlight Card" (preetsuthar17): cursor-following radial highlight, re-skinned for a light surface. */
export function SpotlightCard({ children, className = '', color = 'rgba(16,185,129,0.10)' }: { children: ReactNode; className?: string; color?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [on, setOn] = useState(false)
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={`relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: on ? 1 : 0, background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Animated CV reticle: four corner brackets, a crosshair and an optional sweeping scan line. */
export function ScanOverlay({ active = true, label }: { active?: boolean; label?: string }) {
  const corner = 'absolute h-5 w-5 border-ok'
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className={active ? 'reticle-pulse absolute inset-3' : 'absolute inset-3'}>
        <span className={`${corner} left-0 top-0 rounded-tl-lg border-l-2 border-t-2`} />
        <span className={`${corner} right-0 top-0 rounded-tr-lg border-r-2 border-t-2`} />
        <span className={`${corner} bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2`} />
        <span className={`${corner} bottom-0 right-0 rounded-br-lg border-b-2 border-r-2`} />
      </div>
      {active && <div className="scan-line" />}
      {label && <span className="badge-cv absolute bottom-3 left-3 bg-white/90 backdrop-blur">{label}</span>}
    </div>
  )
}

/** Pill tabs (21st.dev Tabs pattern): single selection, roving buttons, accessible tablist. */
export function PillTabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${value === o.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

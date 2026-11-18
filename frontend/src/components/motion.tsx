import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Returns [ref, seen]: seen flips true the first time the element scrolls into view. */
export function useInView<T extends Element>(threshold = 0.18): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined' || reduced())
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, threshold])
  return [ref, seen]
}

/** Scroll reveal: fades and lifts children in once, with an optional stagger index. */
export function Reveal({ children, i = 0, className = '' }: { children: ReactNode; i?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} data-seen={seen} className={`reveal ${className}`} style={{ ['--i' as string]: i } as CSSProperties}>
      {children}
    </div>
  )
}

/** Animated counter (ease-out) that starts when scrolled into view. Value changes re-animate from the previous number. */
export function CountUp({ value, decimals = 0, suffix = '', className = '' }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4)
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (!seen) return
    if (reduced()) {
      setShown(value)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 700)
      const e = 1 - Math.pow(1 - p, 3)
      setShown(a + (value - a) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, seen])
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export interface FaqItem {
  q: string
  a: ReactNode
}

/** Accordion (single open) using a grid-rows transition so height animates without measuring. */
export function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q}>
            <h3>
              <button
                id={`faq-b-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-p-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-display text-lg font-semibold transition-colors hover:bg-paper"
              >
                {it.q}
                <ChevronDown size={18} className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </h3>
            <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="px-6 pb-6 text-muted">{it.a}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

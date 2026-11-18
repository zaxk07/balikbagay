import { ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Scroll Stacking Cards. Rebuilt from the 21st.dev component spec (@aakashmehra/scroll-stacking-cards):
 * sticky, pinned cards that rise in tilted and blurred, flatten and sharpen as they land,
 * then sink back and peek out above as the next card arrives. Spring-smoothed, with a reduced-motion fallback.
 * Links are internal (hash routes), never target="_blank".
 */
export interface StackCard {
  id: string
  title: string
  eyebrow: string
  description: string
  href: string
  cta: string
  /** CSS colour used for the card's glow and accent rule. */
  accent: string
  visual: ReactNode
}

const SPRING = { stiffness: 160, damping: 28, mass: 0.4 }
const CORNER_R = 22
const notch: CSSProperties = {
  width: CORNER_R,
  height: CORNER_R,
  background: `radial-gradient(circle at 100% 0, transparent ${CORNER_R - 0.5}px, #F8FAFC ${CORNER_R}px)`,
}

function CardFace({ card, index, total }: { card: StackCard; index: number; total: number }) {
  return (
    <a
      href={card.href}
      aria-label={`${card.title}: ${card.cta}`}
      className="group relative block h-full w-full overflow-hidden rounded-[28px] bg-ink text-white shadow-[0_40px_90px_-40px_rgba(15,41,34,0.65)] ring-1 ring-white/10 outline-offset-4"
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: card.accent }} />
      <div className="relative grid h-full gap-6 p-5 pb-28 sm:p-8 sm:pb-32 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-10">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/45">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {card.eyebrow}
          </p>
          <p className="mt-4 max-w-md text-base text-white/70 sm:text-lg">{card.description}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: card.accent }}>
            {card.cta} <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
        <div className="hidden min-h-0 md:block">{card.visual}</div>
      </div>

      {/* Cut-out corner holding the name and link */}
      <div className="absolute bottom-0 left-0 flex items-end">
        <div className="relative rounded-tr-[22px] bg-paper py-3 pl-1 pr-4 text-ink sm:py-4 sm:pr-6">
          <span aria-hidden className="absolute left-0" style={{ ...notch, bottom: '100%' }} />
          <span aria-hidden className="absolute bottom-0" style={{ ...notch, left: '100%' }} />
          <span className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold leading-tight sm:text-2xl">{card.title}</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-200 group-hover:rotate-45 sm:h-9 sm:w-9">
              <ArrowUpRight size={16} />
            </span>
          </span>
        </div>
      </div>
    </a>
  )
}

// Geometry in vh: each card owns a SLOT of scroll, pins at PIN from the top, and the stack holds for TAIL after the last lands.
const SLOT = 76
const PIN = 12
const TAIL = 40
const LAND = 100 - PIN // scroll distance from "top enters viewport" to "pinned"

function StackItem({ card, index, total, progress }: { card: StackCard; index: number; total: number; progress: MotionValue<number> }) {
  // All motion is driven by the container's progress: a pinned element can't measure its own scroll.
  const C = total * SLOT + TAIL
  const enterFrom = (index * SLOT) / C
  const landed = (index * SLOT + LAND) / C
  const allLanded = ((total - 1) * SLOT + LAND) / C
  const enter = useTransform(progress, [enterFrom, landed], [0, 1])

  // Entrance: lean toward the viewer and out of focus, then flatten and sharpen.
  const rotateX = useSpring(useTransform(enter, [0, 1], [18, 0]), SPRING)
  const y = useSpring(useTransform(enter, [0, 1], [80, 0]), SPRING)
  const blurPx = useSpring(useTransform(enter, [0.2, 0.9], [8, 0]), SPRING)
  const filterIn = useTransform(blurPx, (b) => (b < 0.05 ? 'none' : `blur(${b.toFixed(2)}px)`))

  // Sink: once later cards land, this one scales back, lifts and dims, peeking out above.
  const depth = total - 1 - index
  const sinkRange = index === total - 1 ? [0, 1] : [landed, allLanded]
  const sinkScale = useSpring(useTransform(progress, sinkRange, [1, 1 - depth * 0.05]), SPRING)
  const enterScale = useSpring(useTransform(enter, [0, 1], [0.92, 1]), SPRING)
  const scale = useTransform([enterScale, sinkScale], ([a, b]) => (a as number) * (b as number))
  const lift = useSpring(useTransform(progress, sinkRange, [0, -depth * 16]), SPRING)
  const translateY = useTransform([y, lift], ([a, b]) => (a as number) + (b as number))
  const dim = useTransform(progress, sinkRange, [0, depth * 0.12])

  return (
    <div className="sticky flex items-start justify-center [perspective:1200px]" style={{ zIndex: index + 1, top: `${PIN}vh`, height: `${SLOT}vh` }}>
      <motion.div
        className="relative h-[66vh] w-full origin-top will-change-transform sm:h-[68vh]"
        style={{ rotateX, y: translateY, scale, filter: filterIn, top: index * 10 }}
      >
        <CardFace card={card} index={index} total={total} />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] bg-black" style={{ opacity: dim }} />
      </motion.div>
    </div>
  )
}

export function ScrollStackingCards({ cards, className = '' }: { cards: StackCard[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })

  if (reduce) {
    return (
      <div className={`grid gap-6 ${className}`}>
        {cards.map((c, i) => (
          <div key={c.id} className="h-[460px]"><CardFace card={c} index={i} total={cards.length} /></div>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className={`relative ${className}`} style={{ paddingBottom: `${TAIL}vh` }}>
      {cards.map((c, i) => (
        <StackItem key={c.id} card={c} index={i} total={cards.length} progress={scrollYProgress} />
      ))}
    </div>
  )
}

export default ScrollStackingCards

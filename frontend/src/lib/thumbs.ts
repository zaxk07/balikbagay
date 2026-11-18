import type { Item, Kind } from './types'

type Palette = [string, string, string]

const BG = '#efe9dd'

const shadow = (cx = 100, cy = 176, rx = 44) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="5" fill="#000" opacity="0.12"/>`

const ART: Record<Kind, (c: Palette) => string> = {
  tumbler: ([a, b, c]) => `
    ${shadow()}
    <path d="M78 40 Q100 14 122 40" fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round"/>
    <rect x="68" y="38" width="64" height="18" rx="6" fill="${b}"/>
    <path d="M70 56 H130 L122 168 Q121 174 114 174 H86 Q79 174 78 168 Z" fill="${a}"/>
    <path d="M84 62 L88 168" stroke="${c}" stroke-width="4" opacity="0.35" stroke-linecap="round"/>
    <rect x="76" y="96" width="48" height="26" rx="4" fill="${c}" opacity="0.22"/>
    <circle cx="100" cy="109" r="6" fill="${c}" opacity="0.5"/>`,
  calculator: ([a, b, c]) => `
    ${shadow()}
    <rect x="58" y="26" width="84" height="148" rx="10" fill="${a}"/>
    <rect x="66" y="36" width="68" height="26" rx="3" fill="${b}"/>
    <rect x="70" y="42" width="30" height="5" fill="#4e6b4b" opacity="0.6"/>
    ${[0, 1, 2, 3, 4, 5]
      .flatMap((r) =>
        [0, 1, 2, 3, 4].map(
          (col) => `<rect x="${66 + col * 14}" y="${72 + r * 15}" width="11" height="10" rx="2.5" fill="${r < 2 ? '#5b5f69' : c}" opacity="${r < 2 ? 1 : 0.85}"/>`,
        ),
      )
      .join('')}`,
  charger: ([a, b, c]) => `
    ${shadow()}
    <rect x="76" y="150" width="48" height="22" rx="4" fill="${c}"/>
    <rect x="68" y="60" width="64" height="94" rx="14" fill="${a}"/>
    <rect x="86" y="44" width="28" height="20" rx="10" fill="${b}"/>
    <rect x="92" y="50" width="16" height="8" rx="4" fill="#111"/>
    <rect x="78" y="76" width="44" height="3" rx="1.5" fill="${c}"/>
    <rect x="78" y="86" width="30" height="3" rx="1.5" fill="${c}"/>
    <path d="M100 172 C100 186 134 186 140 176" fill="none" stroke="${b}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`,
  umbrella: ([a, b, c]) => `
    ${shadow(100, 178, 30)}
    <path d="M100 18 C124 40 124 104 108 142 L92 142 C76 104 76 40 100 18 Z" fill="${a}"/>
    <path d="M100 18 L100 142 M100 22 C92 56 90 100 94 142 M100 22 C108 56 110 100 106 142" stroke="${c}" stroke-width="2" fill="none" opacity="0.5"/>
    <rect x="90" y="96" width="20" height="12" rx="3" fill="${b}" opacity="0.9"/>
    <rect x="97" y="142" width="6" height="22" fill="${b}"/>
    <path d="M100 160 V170 Q100 182 88 182 Q80 182 80 174" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/>`,
  lanyard: ([a, b, c]) => `
    ${shadow()}
    <path d="M52 14 L92 98 M148 14 L108 98" stroke="${a}" stroke-width="18" stroke-linecap="butt"/>
    <path d="M52 14 L92 98 M148 14 L108 98" stroke="${b}" stroke-width="2" stroke-dasharray="2 8" opacity="0.7"/>
    <rect x="92" y="94" width="16" height="14" rx="3" fill="#b9bcc2"/>
    <rect x="68" y="108" width="64" height="64" rx="6" fill="${b}"/>
    <rect x="68" y="108" width="64" height="16" rx="6" fill="${a}"/>
    <circle cx="100" cy="138" r="8" fill="${c}"/>
    <rect x="80" y="152" width="40" height="4" rx="2" fill="#9a9a9a"/>
    <rect x="86" y="160" width="28" height="4" rx="2" fill="#bdbdbd"/>`,
  earbuds: ([a, b, c]) => `
    ${shadow()}
    <rect x="56" y="70" width="88" height="82" rx="34" fill="${a}"/>
    <path d="M56 100 H144" stroke="${b}" stroke-width="3"/>
    <circle cx="100" cy="124" r="5" fill="${c}"/>
    <ellipse cx="82" cy="46" rx="11" ry="15" fill="${a}" stroke="${b}" stroke-width="2"/>
    <rect x="86" y="54" width="6" height="22" rx="3" fill="${a}" stroke="${b}" stroke-width="2"/>
    <ellipse cx="118" cy="46" rx="11" ry="15" fill="${a}" stroke="${b}" stroke-width="2"/>
    <rect x="108" y="54" width="6" height="22" rx="3" fill="${a}" stroke="${b}" stroke-width="2"/>`,
  notebook: ([a, b, c]) => `
    ${shadow()}
    <rect x="56" y="24" width="90" height="148" rx="6" fill="${a}"/>
    ${Array.from({ length: 11 }, (_, i) => `<rect x="50" y="${34 + i * 12}" width="14" height="5" rx="2.5" fill="#c9ccd2"/>`).join('')}
    <rect x="76" y="48" width="56" height="42" rx="3" fill="${b}"/>
    <rect x="82" y="56" width="40" height="4" rx="2" fill="${a}" opacity="0.6"/>
    <rect x="82" y="66" width="30" height="4" rx="2" fill="${a}" opacity="0.4"/>
    <circle cx="124" cy="150" r="9" fill="${c}"/>`,
  flashdrive: ([a, b, c]) => `
    ${shadow()}
    <rect x="82" y="26" width="36" height="46" rx="3" fill="${b}"/>
    <rect x="90" y="36" width="6" height="8" fill="#555"/><rect x="104" y="36" width="6" height="8" fill="#555"/>
    <rect x="70" y="70" width="60" height="100" rx="12" fill="${a}"/>
    <rect x="70" y="92" width="60" height="10" fill="${c}" opacity="0.35"/>
    <circle cx="100" cy="148" r="8" fill="${BG}"/>`,
  glasscase: ([a, b, c]) => `
    ${shadow(100, 156, 62)}
    <rect x="36" y="74" width="128" height="76" rx="30" fill="${a}"/>
    <path d="M36 112 H164" stroke="${c}" stroke-width="3"/>
    <rect x="90" y="104" width="20" height="14" rx="4" fill="${b}"/>
    <path d="M52 92 Q100 80 148 92" stroke="${b}" stroke-width="2" fill="none" opacity="0.5"/>`,
  hoodie: ([a, b, c]) => `
    ${shadow(100, 178, 58)}
    <path d="M70 34 Q100 52 130 34 L168 66 L152 100 L136 90 V170 H64 V90 L48 100 L32 66 Z" fill="${a}"/>
    <path d="M70 34 Q100 70 130 34 Q100 22 70 34 Z" fill="${c}"/>
    <path d="M90 62 V88 M110 62 V88" stroke="${b}" stroke-width="3" stroke-linecap="round"/>
    <path d="M78 124 H122 L128 152 H72 Z" fill="${c}" opacity="0.6"/>`,
  keys: ([a, b, c]) => `
    ${shadow()}
    <circle cx="100" cy="56" r="26" fill="none" stroke="${c}" stroke-width="6"/>
    <path d="M100 82 V104" stroke="${c}" stroke-width="4"/>
    <rect x="84" y="102" width="32" height="40" rx="8" fill="${a}"/>
    <circle cx="100" cy="116" r="5" fill="${BG}"/>
    <g fill="${b}">
      <rect x="52" y="64" width="12" height="62" rx="5" transform="rotate(-24 58 64)"/>
      <rect x="136" y="64" width="12" height="62" rx="5" transform="rotate(24 142 64)"/>
      <rect x="44" y="108" width="20" height="8" transform="rotate(-24 58 64)"/>
      <rect x="136" y="108" width="20" height="8" transform="rotate(24 142 64)"/>
    </g>`,
  tote: ([a, b, c]) => `
    ${shadow(100, 176, 56)}
    <path d="M70 74 C70 22 130 22 130 74" fill="none" stroke="${b}" stroke-width="7" stroke-linecap="round"/>
    <path d="M52 70 H148 L156 170 H44 Z" fill="${a}"/>
    <rect x="70" y="112" width="60" height="42" rx="4" fill="${c}" opacity="0.5"/>
    <path d="M52 70 H148" stroke="${b}" stroke-width="4"/>`,
  powerbank: ([a, b, c]) => `
    ${shadow(100, 170, 58)}
    <rect x="46" y="62" width="108" height="104" rx="14" fill="${a}"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${70 + i * 20}" cy="86" r="4.5" fill="${b}"/>`).join('')}
    <rect x="70" y="112" width="60" height="30" rx="5" fill="${c}" opacity="0.45"/>
    <rect x="60" y="62" width="24" height="5" fill="#111"/>`,
}

export function thumbSvg(item: Pick<Item, 'kind' | 'colors'>, bg: string = BG): string {
  const art = ART[item.kind](item.colors)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/>${art}</svg>`
}

const cache = new Map<string, string>()

export function thumbUri(item: Pick<Item, 'kind' | 'colors'>, bg: string = BG): string {
  const key = item.kind + item.colors.join() + bg
  let uri = cache.get(key)
  if (!uri) {
    uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(thumbSvg(item, bg))}`
    cache.set(key, uri)
  }
  return uri
}

export function itemImage(item: Item): string {
  return item.image ?? thumbUri(item)
}

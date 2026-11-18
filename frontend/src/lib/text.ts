/**
 * TF-IDF + cosine similarity, matching scikit-learn's TfidfVectorizer
 * (sublinear_tf, smooth idf, l2 norm) with the same custom tokenizer as backend/matcher.py.
 */
const STOP = new Set(
  'a an the and or of in on at to for with is are was were it its i my me we our this that there near by from have has had left lost found after very some into as be been can just one'.split(
    ' ',
  ),
)

const SYNONYMS: Record<string, string> = {
  aquaflask: 'tumbler', flask: 'tumbler', thermos: 'tumbler', bottle: 'tumbler',
  adapter: 'charger', charging: 'charger', plug: 'charger',
  calc: 'calculator', casio: 'calculator',
  earphones: 'earbuds', earphone: 'earbuds', airpods: 'earbuds', earbud: 'earbuds',
  usb: 'usb', thumbdrive: 'flashdrive', flash: 'flashdrive', drive: 'flashdrive', pendrive: 'flashdrive',
  jacket: 'hoodie', sweater: 'hoodie', pullover: 'hoodie',
  gray: 'grey', navy: 'blue', maroon: 'red', powerbank: 'power', bank: 'power',
  id: 'lanyard', card: 'lanyard', strap: 'lanyard',
  bag: 'tote', backpack: 'tote',
  specs: 'eyeglasses', glasses: 'eyeglasses', spectacles: 'eyeglasses',
  keychain: 'keys', key: 'keys',
}

const NOSTEM = new Set(['cics', 'cea', 'cit'])

export function tokenize(text: string): string[] {
  const out: string[] = []
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue
    let t = raw.length > 3 && raw.endsWith('s') && !raw.endsWith('ss') && !NOSTEM.has(raw) ? raw.slice(0, -1) : raw
    t = SYNONYMS[t] ?? SYNONYMS[raw] ?? t
    out.push(t)
  }
  return out
}

export interface TfidfModel {
  vocab: Map<string, number>
  idf: number[]
  docs: Map<number, number>[]
  docTokens: Set<string>[]
}

function weigh(tokens: string[], vocab: Map<string, number>, idf: number[]): Map<number, number> {
  const tf = new Map<number, number>()
  for (const t of tokens) {
    const i = vocab.get(t)
    if (i !== undefined) tf.set(i, (tf.get(i) ?? 0) + 1)
  }
  const vec = new Map<number, number>()
  let norm = 0
  for (const [i, c] of tf) {
    const w = (1 + Math.log(c)) * idf[i]
    vec.set(i, w)
    norm += w * w
  }
  norm = Math.sqrt(norm)
  if (norm > 0) for (const [i, w] of vec) vec.set(i, w / norm)
  return vec
}

export function buildModel(corpus: string[]): TfidfModel {
  const tokenized = corpus.map(tokenize)
  const vocab = new Map<string, number>()
  const df: number[] = []
  for (const toks of tokenized) {
    for (const t of new Set(toks)) {
      if (!vocab.has(t)) { vocab.set(t, vocab.size); df.push(0) }
      df[vocab.get(t)!]++
    }
  }
  const n = corpus.length
  const idf = df.map((d) => Math.log((1 + n) / (1 + d)) + 1)
  return { vocab, idf, docs: tokenized.map((t) => weigh(t, vocab, idf)), docTokens: tokenized.map((t) => new Set(t)) }
}

export function scoreQuery(model: TfidfModel, query: string): { scores: number[]; tokens: Set<string> } {
  const tokens = tokenize(query)
  const q = weigh(tokens, model.vocab, model.idf)
  const scores = model.docs.map((d) => {
    let dot = 0
    for (const [i, w] of q) dot += w * (d.get(i) ?? 0)
    return dot
  })
  return { scores, tokens: new Set(tokens) }
}

/** Per-term contribution to the cosine score between a query and one document (what the score is made of). */
export function explain(model: TfidfModel, query: string, docIndex: number, top = 5): { token: string; weight: number }[] {
  const q = weigh(tokenize(query), model.vocab, model.idf)
  const d = model.docs[docIndex]
  const inv = new Map<number, string>()
  for (const [t, i] of model.vocab) inv.set(i, t)
  const out: { token: string; weight: number }[] = []
  for (const [i, w] of q) {
    const dw = d.get(i)
    if (dw) out.push({ token: inv.get(i)!, weight: w * dw })
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, top)
}

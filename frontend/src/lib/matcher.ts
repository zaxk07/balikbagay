import { buildModel, scoreQuery, type TfidfModel } from './text'
import { itemImage } from './thumbs'
import { extractFeatures, loadImage, visualSimilarity } from './vision'
import { TEXT_WEIGHT, VISUAL_WEIGHT, type Features, type Item, type MatchMode, type MatchQuery, type MatchResult, type Tag } from './types'

const featureCache = new Map<string, Promise<Features>>()

export async function featuresFromSrc(src: string): Promise<Features> {
  return extractFeatures(await loadImage(src))
}

export function getItemFeatures(item: Item): Promise<Features> {
  const key = `${item.id}:${item.image?.length ?? 0}`
  let p = featureCache.get(key)
  if (!p) {
    p = featuresFromSrc(itemImage(item))
    featureCache.set(key, p)
  }
  return p
}

export const itemDoc = (i: Item) => `${i.title} ${i.category} ${i.building} ${i.spot} ${i.description}`
export const queryDoc = (q: Pick<MatchQuery, 'description' | 'location' | 'category'>) =>
  `${q.description} ${q.category} ${q.location}`

let modelCache: { key: string; model: TfidfModel } | null = null
function modelFor(items: Item[]): TfidfModel {
  const key = items.map((i) => i.id + i.description.length).join('|')
  if (modelCache?.key !== key) modelCache = { key, model: buildModel(items.map(itemDoc)) }
  return modelCache.model
}

/** Weighted fusion: 0.55 * visual + 0.45 * text (weights redistribute if one modality is missing). */
export function fuse(visual: number, text: number, hasImage: boolean, hasText: boolean): { overall: number; mode: MatchMode } {
  if (hasImage && hasText) return { overall: VISUAL_WEIGHT * visual + TEXT_WEIGHT * text, mode: 'hybrid' }
  if (hasImage) return { overall: visual, mode: 'visual-only' }
  return { overall: text, mode: 'text-only' }
}

export async function rankLocal(items: Item[], query: MatchQuery, limit = 8): Promise<MatchResult[]> {
  const pool = items.filter((i) => i.status === 'Unclaimed')
  const model = modelFor(items)
  const { scores, tokens } = scoreQuery(model, queryDoc(query))
  const textScore = new Map(items.map((it, idx) => [it.id, scores[idx]]))
  const tokenSets = new Map(items.map((it, idx) => [it.id, model.docTokens[idx]]))
  const hasText = tokens.size > 0
  const hasImage = !!query.image

  const results = await Promise.all(
    pool.map(async (item): Promise<MatchResult> => {
      const text = textScore.get(item.id) ?? 0
      let visual = 0
      let breakdown = { color: 0, edge: 0, shape: 0 }
      const tags: Tag[] = []
      if (query.image) {
        const feat = await getItemFeatures(item)
        const sim = visualSimilarity(query.image, feat)
        visual = sim.score
        breakdown = sim.parts
        for (const c of query.image.colors) if (feat.colors.includes(c)) tags.push({ label: c, kind: 'color' })
      }
      const doc = tokenSets.get(item.id)!
      const colorLabels = new Set(tags.map((t) => t.label))
      const shared = [...tokens].filter((t) => doc.has(t) && !colorLabels.has(t))
      if (query.location && query.location.toLowerCase() === item.building.toLowerCase()) tags.push({ label: item.building, kind: 'place' })
      if (query.category && query.category === item.category) tags.push({ label: item.category, kind: 'category' })
      const skip = new Set([item.building.toLowerCase(), item.category.toLowerCase()])
      for (const t of shared) if (!skip.has(t)) tags.push({ label: t, kind: 'keyword' })
      const { overall, mode } = fuse(visual, text, hasImage, hasText)
      return { item, overall, visual, text, breakdown, tags: tags.slice(0, 7), mode }
    }),
  )
  return results.sort((a, b) => b.overall - a.overall).slice(0, limit)
}

export const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100)))

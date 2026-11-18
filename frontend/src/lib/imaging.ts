import { thumbUri } from './thumbs'
import { loadImage } from './vision'
import type { Item } from './types'

const TONES = ['#dfe6ef', '#e4e7ec', '#d8e0ea', '#e8ecf1']

export function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

/** Center-crop to a square and downscale, so stored photos stay small. */
export async function downscale(src: string, size = 320, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const side = Math.min(w, h)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size)
  return c.toDataURL(type, 0.86)
}

/** A realistic "photo" of a seed item: different background tone, slight rotation, exposure shift and sensor noise. */
export async function presetPhoto(item: Item, variant = 0): Promise<string> {
  const tone = TONES[(variant + item.id.charCodeAt(item.id.length - 1)) % TONES.length]
  const img = await loadImage(thumbUri(item, tone))
  const size = 320
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, size, size)
  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate(((variant % 2 ? -1 : 1) * 3 * Math.PI) / 180)
  ctx.filter = 'brightness(1.06) contrast(0.95) saturate(0.95)'
  ctx.drawImage(img, -size * 0.47, -size * 0.47, size * 0.94, size * 0.94)
  ctx.restore()
  const id = ctx.getImageData(0, 0, size, size)
  let seed = 1337 + variant
  for (let i = 0; i < id.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const n = ((seed >>> 24) / 255 - 0.5) * 10
    id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n
  }
  ctx.putImageData(id, 0, 0)
  return c.toDataURL('image/png')
}

export async function toPngBlob(src: string, size = 256): Promise<Blob> {
  const uri = await downscale(src, size, 'image/png')
  return (await fetch(uri)).blob()
}

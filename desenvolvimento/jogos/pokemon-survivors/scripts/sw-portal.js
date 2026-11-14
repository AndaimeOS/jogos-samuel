/* Service worker do portal: entrega assets/pokemon/<dex>/<arquivo> a partir de packs/p-<dex>.bin. */
const packs = new Map()

const loadPack = (dex) => {
  const hit = packs.get(dex)
  if (hit) return hit
  const pending = fetch(new URL(`packs/p-${dex}.bin`, self.registration.scope))
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status))
      return res.arrayBuffer()
    })
    .then((buf) => {
      const view = new DataView(buf)
      const bytes = new Uint8Array(buf)
      let offset = 0
      const count = view.getUint32(offset, true)
      offset += 4
      const files = new Map()
      const decode = new TextDecoder()
      for (let i = 0; i < count; i++) {
        const len = view.getUint16(offset, true)
        offset += 2
        const path = decode.decode(bytes.subarray(offset, offset + len))
        offset += len
        const size = view.getUint32(offset, true)
        offset += 4
        files.set(path, bytes.slice(offset, offset + size))
        offset += size
      }
      return files
    })
  packs.set(dex, pending)
  return pending
}

const typeOf = (path) => {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'ogg') return 'audio/ogg'
  if (ext === 'json') return 'application/json'
  return 'application/octet-stream'
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const match = url.pathname.match(/\/assets\/pokemon\/(\d+)\/(.+)$/)
  if (!match) return
  const dex = match[1]
  const file = decodeURIComponent(match[2])
  event.respondWith(
    loadPack(dex)
      .then((files) => {
        const data = files.get(file)
        if (!data) return new Response('ausente', { status: 404 })
        return new Response(data, {
          headers: { 'Content-Type': typeOf(file), 'Cache-Control': 'private, max-age=3600' },
        })
      })
      .catch(() => new Response('pacote', { status: 404 })),
  )
})

/**
 * Depois do Vite: junta os PNGs/OGGs de cada espécie num .bin (o porteiro
 * só aceita 3000 arquivos) e grava o service worker que os entrega no caminho original.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '..', '..', '..', '_privado', 'jogos', 'pokemon-survivors')
const pokemon = join(out, 'assets', 'pokemon')

const walk = (dir, base = dir) => {
  const files = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) files.push(...walk(abs, base))
    else files.push(relative(base, abs).split('\\').join('/'))
  }
  return files
}

const packDir = (dir) => {
  const files = walk(dir).sort()
  const chunks = [Buffer.alloc(4)]
  chunks[0].writeUInt32LE(files.length, 0)
  for (const rel of files) {
    const path = Buffer.from(rel)
    const head = Buffer.alloc(2 + path.length + 4)
    head.writeUInt16LE(path.length, 0)
    path.copy(head, 2)
    const body = readFileSync(join(dir, rel))
    head.writeUInt32LE(body.length, 2 + path.length)
    chunks.push(head, body)
  }
  return Buffer.concat(chunks)
}

if (!statSync(pokemon, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('pasta de sprites ausente no pacote:', pokemon)
  process.exit(1)
}

const faviconFrom = join(pokemon, '25', 'portrait.png')
if (statSync(faviconFrom, { throwIfNoEntry: false })?.isFile()) copyFileSync(faviconFrom, join(out, 'favicon.png'))

const packs = join(out, 'packs')
mkdirSync(packs, { recursive: true })
const species = readdirSync(pokemon).filter((name) => statSync(join(pokemon, name)).isDirectory())
let bytes = 0
let largest = { name: '', size: 0 }
for (const dex of species) {
  const bin = packDir(join(pokemon, dex))
  const file = join(packs, `p-${dex}.bin`)
  writeFileSync(file, bin)
  bytes += bin.length
  if (bin.length > largest.size) largest = { name: `packs/p-${dex}.bin`, size: bin.length }
}
rmSync(pokemon, { recursive: true, force: true })
for (const name of readdirSync(out)) {
  if (name.endsWith('.webmanifest')) rmSync(join(out, name))
}
copyFileSync(join(root, 'scripts', 'sw-portal.js'), join(out, 'sw.js'))

const summary = {
  especies: species.length,
  pacotesBytes: bytes,
  maior: largest,
}
writeFileSync(join(out, 'packs', 'resumo.json'), JSON.stringify(summary))
console.log(JSON.stringify(summary, null, 2))

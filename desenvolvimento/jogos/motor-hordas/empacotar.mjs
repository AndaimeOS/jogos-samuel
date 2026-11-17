import { build } from 'esbuild'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(aqui, '../../..')
const licenca = await readFile(path.join(raiz, 'desenvolvimento/jogos/pokemon-survivors/LICENSE'), 'utf8')

const pagina = (titulo) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${titulo}</title>
<style>
  html, body { margin: 0; height: 100%; background: #3A8FB5; color: #193337; overflow: hidden; }
  body { display: flex; align-items: center; justify-content: center; font-family: "Courier New", Courier, monospace; }
  #jogo { position: relative; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; overflow: hidden; touch-action: none; background: #193337; }
  #jogo.cheia-fallback { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 30; }
  #tela { position: absolute; inset: 0; margin: auto; image-rendering: pixelated; image-rendering: crisp-edges; }
  button, a.btn {
    min-width: 48px; min-height: 48px; box-sizing: border-box;
    border: 2px solid #193337; border-radius: 0; background: #F5F2E8; color: #193337;
    box-shadow: 3px 3px 0 #193337; font: 900 16px/1.1 "Courier New", Courier, monospace;
    padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    text-decoration: none;
  }
  button:focus-visible, a.btn:focus-visible { outline: 3px solid #9956E0; outline-offset: 2px; }
  button:disabled { opacity: 0.45; }
  button img, a img { width: 32px; height: 32px; image-rendering: pixelated; pointer-events: none; }
  #hud { position: absolute; z-index: 4; top: 8px; left: 8px; right: 8px; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  #hud .linha { display: flex; align-items: center; gap: 8px; min-width: 0; }
  #hud button, #hud a { pointer-events: auto; width: 48px; height: 48px; padding: 0; }
  #retrato { width: 48px; height: 48px; image-rendering: pixelated; background: #F5F2E8; border: 2px solid #193337; box-shadow: 3px 3px 0 #193337; object-fit: contain; }
  #nivel, #relogio, #album {
    min-width: 48px; min-height: 48px; box-sizing: border-box; background: #F5F2E8;
    border: 2px solid #193337; box-shadow: 3px 3px 0 #193337;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 900; padding: 0 8px;
  }
  #medXp, #medChefe { flex: 1; min-width: 0; background: #F5F2E8; border: 2px solid #193337; box-shadow: 3px 3px 0 #193337; }
  #medXp { height: 48px; padding: 0 10px; box-sizing: border-box; display: flex; align-items: center; position: relative; overflow: hidden; }
  #faseNome { position: relative; z-index: 1; font-weight: 900; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #iconePerigo { width: 32px; height: 32px; flex: none; margin-right: 8px; position: relative; z-index: 1; background-repeat: no-repeat; background-size: 200% 100%; image-rendering: pixelated; }
  #barraXp { position: absolute; left: 0; bottom: 0; height: 8px; width: 0; background: #CEB7EF; }
  #medChefe { height: 22px; }
  #barraChefe { display: block; height: 100%; width: 0; background: #E2544A; }
  #vidas, #golpes, #itens { display: flex; gap: 4px; }
  #vidas img, #golpes img, #itens img { width: 28px; height: 28px; image-rendering: pixelated; background: #F5F2E8; border: 2px solid #193337; }
  #minimapa { width: 72px; height: 72px; border: 2px solid #193337; background: #193337; image-rendering: pixelated; }
  .folha { background-repeat: no-repeat; background-position: 0 0; background-size: 200% 100%; image-rendering: pixelated; }
  #joystick { position: absolute; z-index: 5; width: 120px; height: 120px; touch-action: none; }
  #joystick .base { width: 120px; height: 120px; }
  #knob { position: absolute; width: 48px; height: 48px; left: 36px; top: 36px; }
  #btnAcao { position: absolute; z-index: 5; right: 16px; bottom: 16px; width: 64px; height: 64px; padding: 0; background-color: #FF9D52; }
  #btnPausa, #btnTela { background-color: #F5F2E8; }
  #mapa, #levelup, #vitoria, #derrota, #fim, #pausa, #creditos {
    position: absolute; inset: 0; z-index: 6; background: #F5F2E8; display: flex; flex-direction: column;
  }
  #mapa { background: #8FCB6B; }
  #mapa.agua { background: #1B5A6E; }
  #faixas { position: absolute; inset: 0; }
  #mapa:not(.agua) #faixas { background: linear-gradient(90deg, #8FCB6B 0 28%, #E7A15A 28% 52%, #C9C9C4 52% 76%, #F0D56A 76% 88%, #3AA0B8 88% 100%); }
  #mapa.agua #faixas { background: linear-gradient(90deg, #3FA8A6 0 34%, #2B7F78 34% 67%, #1B5A6E 67% 100%); }
  #mapa.agua #faixas::before, #mapa.agua #faixas::after { content: ""; position: absolute; left: 0; right: 0; height: 14%; background: linear-gradient(90deg, #8FCB6B 0 72%, #E6C85A 72% 100%); }
  #mapa.agua #faixas::before { top: 0; }
  #mapa.agua #faixas::after { bottom: 0; }
  #levelup { background: rgba(25, 51, 55, .45); align-items: center; justify-content: center; }
  #cartas { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; padding: 16px; max-width: 100%; }
  .carta { width: min(220px, 30vw); min-height: 120px; flex-direction: column; background: #F5F2E8; }
  .carta img { width: 48px; height: 48px; }
  #palco { position: relative; flex: 1; min-height: 0; }
  #cenario { position: absolute; object-fit: fill; image-rendering: pixelated; pointer-events: none; }
  #nos { position: absolute; }
  #nos button { position: absolute; padding: 0; background-color: transparent; border: 0; box-shadow: none; min-width: 48px; min-height: 48px; }
  #marca { position: absolute; width: 32px; height: 48px; image-rendering: pixelated; pointer-events: none; z-index: 2; }
  .faixa { display: flex; gap: 8px; padding: 8px; align-items: center; }
  .faixa h1 { margin: 0; font-size: 22px; }
  .miolo { margin: auto; display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center; padding: 16px; }
  #fimSprite, #trofeu { width: 96px; height: auto; image-rendering: pixelated; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<div id="jogo">
  <canvas id="tela" width="320" height="240"></canvas>
  <canvas id="minimapa" width="72" height="72"></canvas>
  <div id="hud">
    <div class="linha">
      <img id="retrato" alt="" width="40" height="40">
      <div id="nivel">1</div>
      <div id="medXp"><div id="iconePerigo" hidden></div><span id="faseNome"></span><b id="barraXp"></b></div>
      <div id="relogio">00:00</div>
      <div id="album" hidden>0</div>
      <a id="btnJogos" class="btn" href="/jogos/" target="_top" data-alvo>←</a>
      <button type="button" id="btnPausa" class="folha" data-alvo aria-label="Pausa" style="background-image:url(arte/controles/botao-pausa.png)"></button>
      <button type="button" id="btnTela" class="folha" data-alvo aria-label="Tela cheia" style="background-image:url(arte/controles/botao-tela-cheia.png)"></button>
    </div>
    <div class="linha">
      <div id="vidas"></div>
      <div id="golpes"></div>
      <div id="itens"></div>
    </div>
    <div id="medChefe" hidden><b id="barraChefe"></b></div>
  </div>
  <div id="joystick" data-alvo aria-label="Joystick"><div class="base folha" style="background-image:url(arte/controles/joystick-base.png)"></div><div id="knob" class="folha" style="background-image:url(arte/controles/joystick-bola.png)"></div></div>
  <button type="button" id="btnAcao" class="folha" data-alvo aria-label="Ação" style="background-image:url(arte/controles/botao-acao.png)"></button>
  <div id="mapa">
    <div class="faixa">
      <h1>${titulo}</h1>
      <button type="button" id="btnFacil" data-alvo aria-pressed="true">Fácil</button>
      <button type="button" id="btnNormal" data-alvo aria-pressed="false">Normal</button>
      <button type="button" id="btnCreditos" data-alvo>Créditos</button>
    </div>
    <div id="palco"><div id="faixas"></div><img id="cenario" alt="" src="arte/mapa/mapa_mock.png"><img id="marca" alt=""><div id="nos"></div></div>
  </div>
  <div id="levelup" hidden><div id="cartas"></div></div>
  <div id="vitoria" hidden>
    <div class="miolo">
      <img id="trofeu" alt="" src="arte/mapa/vitoria/trofeu.png">
      <p>Fase vencida.</p>
      <button type="button" id="btnProxima" data-alvo>Próxima</button>
    </div>
  </div>
  <div id="derrota" hidden>
    <div class="miolo">
      <p>A fase acabou.</p>
      <button type="button" id="btnDeNovo" data-alvo>De novo</button>
    </div>
  </div>
  <div id="fim" hidden>
    <div class="miolo">
      <img id="fimSprite" alt="">
      <p id="fimTitulo"></p>
      <p id="fimTexto"></p>
      <button type="button" id="btnFimMapa" data-alvo>Mapa</button>
    </div>
  </div>
  <div id="pausa" hidden>
    <div class="miolo">
      <button type="button" id="btnContinuar" data-alvo>Continuar</button>
      <button type="button" id="btnRecemecar" data-alvo>Recomeçar</button>
      <button type="button" id="btnMapaPausa" data-alvo>Mapa</button>
    </div>
  </div>
  <div id="creditos" hidden>
    <div class="miolo">
      <p>Código do motor: Copyright (c) 2026 Pedro Barretto. Licença MIT.</p>
      <p>Arte original deste jogo. Sem criatura, sprite ou som de terceiros.</p>
      <button type="button" id="btnFechaCreditos" data-alvo>Fechar</button>
    </div>
  </div>
</div>
<script type="module" src="./jogo.js"></script>
<script>
  document.getElementById('btnCreditos').addEventListener('click', () => { document.getElementById('creditos').hidden = false })
  document.getElementById('btnFechaCreditos').addEventListener('click', () => { document.getElementById('creditos').hidden = true })
</script>
</body>
</html>
`

const creditos = `Créditos — motor das hordas

Código
  Copyright (c) 2026 Pedro Barretto
  Pokémon Survivors, licença MIT
  https://github.com/pedrobarretto/pokemon-survivors
  O aviso completo está em LICENSE.txt.

  Entram aqui os sistemas da partida solo: vista, joystick flutuante,
  mapa de regiões, horda que nasce fora da tela, separação dos corpos,
  empurrão, experiência, cartas, tremor, número de dano e partículas.
  Não entram conta, ranking, co-op, arena nem os arquivos de public/assets
  daquele repositório (licença CC BY-NC, que este jogo não usa).

Arte
  Desenhos originais do samuel.tech, ainda em escala de placeholder.
  Nenhuma foto real. Nenhum sprite, nome de criatura ou som de Pokémon.
`

async function limpar(pasta) {
  await mkdir(pasta, { recursive: true })
  for (const nome of await readdir(pasta)) {
    await rm(path.join(pasta, nome), { recursive: true, force: true })
  }
}

async function jogo(slug, entrada, titulo) {
  const pasta = path.join(raiz, '_privado/jogos', slug)
  await limpar(pasta)
  await build({
    entryPoints: [path.join(aqui, 'src/entradas', entrada)],
    bundle: true,
    format: 'esm',
    outfile: path.join(pasta, 'jogo.js'),
    legalComments: 'none',
  })
  await cp(path.join(aqui, 'arte', slug === 'planeta-do-samuel' ? 'planeta' : 'pescador'), path.join(pasta, 'arte'), { recursive: true })
  await writeFile(path.join(pasta, 'index.html'), pagina(titulo))
  await writeFile(path.join(pasta, 'LICENSE.txt'), licenca)
  await writeFile(path.join(pasta, 'CREDITOS.txt'), creditos)
  console.log('empacotado', slug)
}

await jogo('planeta-do-samuel', 'planeta.js', 'Planeta do Samuel')
await jogo('pescador-samuel', 'pescador.js', 'Pescador Samuel')

const capa = path.join(raiz, 'assets/img/pescador-samuel.webp')
const barco = path.join(aqui, 'arte/pescador/sprites/samuel-barco-cinza/Idle.png')
const fundo = await sharp({ create: { width: 1200, height: 675, channels: 3, background: '#1B5A6E' } }).png().toBuffer()
const sprite = await sharp(barco).extract({ left: 0, top: 0, width: 48, height: 48 }).resize(420, 420, { kernel: 'nearest' }).png().toBuffer()
await sharp(fundo).composite([{ input: sprite, gravity: 'centre' }]).webp({ quality: 90 }).toFile(capa)
console.log('capa', capa)

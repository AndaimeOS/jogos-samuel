import {
  ANIMS, CONFIG, FUNDOS, GID_QUEDA, GIDS_PLATAFORMA, GIDS_SOLIDO, ORDEM,
  aoZerarVidas, classificarContato, cortarPulo, decidirBuraco, decidirContato,
  layoutNos, medida, proximaFase,
} from './regras.js';

const PLAT = new Set(GIDS_PLATAFORMA);
const SOLIDO = new Set(GIDS_SOLIDO);
const CHAVE = 'samuel-corredor:v1';

const entrada = { esq: false, dir: false, pulo: false };
const teclas = {};
let ctxAudio = null;
let audioMorto = false;

const $ = (id) => document.getElementById(id);
const btnEsq = $('btnEsq');
const btnDir = $('btnDir');
const btnPulo = $('btnPulo');
const btnPausa = $('btnPausa');
const btnTela = $('btnTela');
const btnCampo = $('btnCampo');
const btnFloresta = $('btnFloresta');
const btnCaverna = $('btnCaverna');
const btnNormal = $('btnNormal');
const btnFacil = $('btnFacil');
const btnSeguir = $('btnSeguir');
const btnRepetir = $('btnRepetir');
const btnProxima = $('btnProxima');
const barra = $('barra');
const painelPausa = $('pausa');
const painelVitoria = $('vitoria');

const api = {
  versao: CONFIG.versao,
  proposta: true,
  config: CONFIG,
  jogo: null,
  tela: 'mapa',
  fase: null,
  modo: 'normal',
  vencidas: [],
  vidas: CONFIG.vidas,
  moedas: 0,
  estrelas: 0,
  derrotados: 0,
  derrotadosTotal: 0,
  pausado: false,
  pronto: false,
  cortarPulo,
  decidirContato,
  decidirBuraco,
};
window.__corredor = api;

addEventListener('unhandledrejection', (evento) => {
  const msg = String(evento.reason && (evento.reason.message || evento.reason) || '');
  if (/audio/i.test(msg)) evento.preventDefault();
});

function prepararSom() {
  if (ctxAudio || audioMorto) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { audioMorto = true; return; }
  try {
    const ctx = new AC();
    ctxAudio = ctx;
    Promise.resolve(ctx.resume()).then(() => {}, () => { audioMorto = true; ctxAudio = null; });
  } catch {
    audioMorto = true;
    ctxAudio = null;
  }
}

function tocar(tipo) {
  try {
    if (!ctxAudio || ctxAudio.state !== 'running') return;
    const receita = {
      moeda: [880, 1320, 0.12, 'square'],
      pof: [220, 70, 0.16, 'triangle'],
      pulo: [340, 520, 0.08, 'square'],
      dano: [160, 80, 0.16, 'square'],
      vitoria: [523, 784, 0.28, 'square'],
    }[tipo];
    if (!receita) return;
    const t = ctxAudio.currentTime;
    const o = ctxAudio.createOscillator();
    const g = ctxAudio.createGain();
    o.type = receita[3];
    o.frequency.setValueAtTime(receita[0], t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, receita[1]), t + receita[2]);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + receita[2]);
    o.connect(g);
    g.connect(ctxAudio.destination);
    o.start(t);
    o.stop(t + receita[2] + 0.02);
  } catch { /* sem som */ }
}

function prender(btn, campo) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    prepararSom();
    entrada[campo] = true;
    btn.classList.add('apertado');
    try { btn.setPointerCapture(e.pointerId); } catch { /* evento sintético do teste */ }
  });
  const solta = () => {
    entrada[campo] = false;
    btn.classList.remove('apertado');
  };
  btn.addEventListener('pointerup', solta);
  btn.addEventListener('pointercancel', solta);
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({
      modo: api.modo, vencidas: api.vencidas, estrelasPorFase: api.estrelasPorFase || {}, schemaVersion: 1,
    }));
  } catch { /* modo privado */ }
}

function carregar() {
  api.estrelasPorFase = {};
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) {
      api.modo = 'facil';
      api.vencidas = [];
      return;
    }
    const d = JSON.parse(bruto);
    api.modo = d.modo === 'normal' ? 'normal' : 'facil';
    api.vencidas = Array.isArray(d.vencidas) ? d.vencidas.filter((id) => ORDEM.includes(id)) : [];
    api.estrelasPorFase = d.estrelasPorFase && typeof d.estrelasPorFase === 'object' ? d.estrelasPorFase : {};
  } catch {
    api.modo = 'facil';
    api.vencidas = [];
  }
}

function liberada(id) {
  if (id === 'campo') return true;
  const anterior = ORDEM[ORDEM.indexOf(id) - 1];
  return api.vencidas.includes(anterior);
}

function atualizarTravas() {
  btnNormal.setAttribute('aria-pressed', api.modo === 'normal' ? 'true' : 'false');
  btnFacil.setAttribute('aria-pressed', api.modo === 'facil' ? 'true' : 'false');
  btnCampo.disabled = !liberada('campo');
  btnFloresta.disabled = !liberada('floresta');
  btnCaverna.disabled = !liberada('caverna');
}

function definirModo(modo) {
  api.modo = modo === 'facil' ? 'facil' : 'normal';
  atualizarTravas();
  salvar();
}
api.definirModo = definirModo;

function layout() {
  const canvas = document.querySelector('#palco canvas');
  if (!canvas || !api.jogo) return;
  const r = canvas.getBoundingClientRect();
  if (r.height < 20) return;
  const z = r.height / CONFIG.altura;
  const gw = api.jogo.scale.width;
  const por = (el, x, y, w, h) => {
    el.style.left = `${r.left + x * z}px`;
    el.style.top = `${r.top + y * z}px`;
    el.style.width = `${Math.max(44, w * z)}px`;
    el.style.height = `${Math.max(44, h * z)}px`;
  };
  por(btnEsq, 6, 202, 32, 32);
  por(btnDir, 44, 202, 32, 32);
  por(btnPulo, gw - 46, 194, 40, 40);
  por(btnPausa, gw - 30, 6, 24, 24);
  por(btnTela, gw - 58, 6, 24, 24);
  for (const f of layoutNos(gw)) {
    const el = f.id === 'campo' ? btnCampo : f.id === 'floresta' ? btnFloresta : btnCaverna;
    const w = Math.max(48, f.w * z);
    const h = Math.max(48, f.h * z);
    el.style.left = `${r.left + f.x * z - w / 2}px`;
    el.style.top = `${r.top + f.y * z - h / 2}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }
  const lado = Math.max(48, 24 * z);
  const prox = Math.max(48, 40 * z);
  btnRepetir.style.width = `${lado}px`;
  btnRepetir.style.height = `${lado}px`;
  btnProxima.style.width = `${prox}px`;
  btnProxima.style.height = `${prox}px`;
}

function mostrar(el, sim) { el.hidden = !sim; }

function controlesDeFase(sim) {
  mostrar(btnEsq, sim);
  mostrar(btnDir, sim);
  mostrar(btnPulo, sim);
  mostrar(btnPausa, sim);
}

function faixas(sim) {
  mostrar(btnCampo, sim);
  mostrar(btnFloresta, sim);
  mostrar(btnCaverna, sim);
}

function faseAtiva() {
  const jogo = api.jogo;
  if (!jogo) return null;
  const cena = jogo.scene.getScene('fase');
  return cena && cena.sys && cena.sys.isActive() ? cena : null;
}

let timerVitoria = 0;
function limparVitoria() {
  clearTimeout(timerVitoria);
  mostrar(painelVitoria, false);
}

function quadro(nome) {
  const tex = api.jogo.textures.get('atlas');
  const frame = tex.get(nome);
  return { img: tex.getSourceImage(), x: frame.cutX, y: frame.cutY, w: frame.width, h: frame.height };
}

function pintarIcone(canvas, nome) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const q = quadro(nome);
  ctx.drawImage(q.img, q.x, q.y, q.w, q.h, 0, 0, canvas.width, canvas.height);
}

function mostrarVitoria(moedas, estrelas, temProxima) {
  $('vitoriaMoedas').textContent = String(moedas);
  pintarIcone($('vitoriaMoedaIcon'), 'moeda/girar_0');
  const caixa = $('vitoriaCristais');
  caixa.replaceChildren();
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    c.className = i < estrelas ? 'cristal cheio' : 'cristal';
    pintarIcone(c, i < estrelas ? 'estrela/brilhar_0' : 'estrela/apagada_0');
    caixa.appendChild(c);
  }
  btnProxima.setAttribute('aria-label', temProxima ? 'Próxima fase' : 'Ver o mapa');
  mostrar(painelVitoria, true);
  controlesDeFase(false);
  mostrar(barra, false);
  api.tela = 'vitoria';
  clearTimeout(timerVitoria);
  timerVitoria = setTimeout(() => {
    if (!painelVitoria.hidden) irProxima();
  }, 4500);
}

function pausar(ligar) {
  const cena = faseAtiva();
  if (!cena || cena.venceu) return;
  api.pausado = ligar;
  if (ligar) {
    cena.physics.pause();
    cena.anims.pauseAll();
    api.tela = 'pausa';
    mostrar(painelPausa, true);
    mostrar(barra, true);
  } else {
    cena.physics.resume();
    cena.anims.resumeAll();
    api.tela = 'fase';
    mostrar(painelPausa, false);
    mostrar(barra, false);
  }
}

function elementoCheio() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement || null;
}

function sincronizarTela() {
  const cheio = !!(elementoCheio() || $('jogo').classList.contains('cresceu'));
  btnTela.style.backgroundImage = `url("arte/controles/${cheio ? 'botao-sair-tela-cheia' : 'botao-tela-cheia'}.png")`;
}

function alternarTela() {
  const raiz = $('jogo');
  if (elementoCheio() || raiz.classList.contains('cresceu')) {
    const sair = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
    if (elementoCheio() && typeof sair === 'function') {
      try {
        const r = sair.call(document);
        if (r && r.catch) r.catch(() => {});
      } catch { /* segue */ }
    }
    raiz.classList.remove('cresceu');
    sincronizarTela();
    return;
  }
  const pedir = raiz.requestFullscreen || raiz.webkitRequestFullscreen || raiz.webkitRequestFullScreen;
  if (typeof pedir === 'function') {
    try {
      const r = pedir.call(raiz);
      if (r && r.catch) r.catch(() => raiz.classList.add('cresceu'));
    } catch {
      raiz.classList.add('cresceu');
    }
  } else {
    raiz.classList.add('cresceu');
  }
  sincronizarTela();
}

function comecar(id) {
  if (!liberada(id)) return;
  limparVitoria();
  mostrar(painelPausa, false);
  api.pausado = false;
  api.fase = id;
  faixas(false);
  mostrar(barra, false);
  controlesDeFase(true);
  const jogo = api.jogo;
  if (jogo.scene.isActive('fase')) jogo.scene.stop('fase');
  if (jogo.scene.isActive('mapa')) jogo.scene.stop('mapa');
  jogo.scene.start('fase', { id });
  api.tela = 'fase';
  requestAnimationFrame(layout);
}

function irMapa() {
  limparVitoria();
  mostrar(painelPausa, false);
  api.pausado = false;
  controlesDeFase(false);
  faixas(true);
  mostrar(barra, true);
  atualizarTravas();
  const jogo = api.jogo;
  if (jogo.scene.isActive('fase')) jogo.scene.stop('fase');
  if (!jogo.scene.isActive('mapa')) jogo.scene.start('mapa');
  api.tela = 'mapa';
}

function irProxima() {
  const seguinte = proximaFase(api.fase);
  if (seguinte && liberada(seguinte)) comecar(seguinte);
  else irMapa();
}

function ajustarCorpo(sprite, bw, bh) {
  const sx = Math.abs(sprite.scaleX) || 1;
  const sy = Math.abs(sprite.scaleY) || 1;
  sprite.body.setSize(bw / sx, bh / sy, false);
  const oy = sprite.originY >= 0.99 ? bh : bh / 2;
  sprite.body.setOffset(sprite.originX * sprite.width - (bw / 2) / sx, sprite.originY * sprite.height - oy / sy);
}

function animar(sprite, key) {
  if (!sprite?.active || !sprite.anims || sprite.anims.currentAnim?.key === key) return;
  sprite.play(key);
}

function estouro(scene, x, y, anim, n) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.sprite(x, y, 'atlas').setDepth(30);
    s.play(anim);
    const a = (Math.PI * 2 * i) / n;
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(a) * 18,
      y: y - 10 + Math.sin(a) * 10,
      alpha: 0,
      duration: 320,
      onComplete: () => s.destroy(),
    });
  }
}

class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() {
    this.load.on('loaderror', (file) => { throw new Error('não carregou ' + file.key); });
    this.load.atlas('atlas', 'arte/atlas.png', 'arte/atlas.json');
    this.load.image('tiles', 'arte/tiles.png');
    this.load.spritesheet('pecas', 'arte/tiles.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('coracao', 'arte/hud/coracao.png');
    this.load.image('coracao-vazio', 'arte/hud/coracao-vazio.png');
    this.load.spritesheet('digitos', 'arte/hud/digitos.png', { frameWidth: 8, frameHeight: 12 });
    for (const fase of ORDEM) {
      this.load.tilemapTiledJSON(fase, `arte/fases/${fase}.json`);
      for (const item of FUNDOS[fase]) this.load.image(item[0], item[1]);
    }
  }
  create() {
    for (const [key, def] of Object.entries(ANIMS)) {
      this.anims.create({
        key,
        frames: def.frames.map((frame) => ({ key: 'atlas', frame })),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
    api.pronto = true;
    this.scale.on('resize', () => layout());
    this.scene.start('mapa');
    requestAnimationFrame(layout);
  }
}

class Mapa extends Phaser.Scene {
  constructor() { super('mapa'); }
  create() {
    api.tela = 'mapa';
    this.g = this.add.graphics().setDepth(0);
    this.frente = this.add.graphics().setDepth(5);
    this.bonecos = [];
    this.desenhar();
    this.scale.on('resize', () => this.desenhar());
    faixas(true);
    mostrar(barra, true);
    controlesDeFase(false);
    atualizarTravas();
    requestAnimationFrame(layout);
  }
  desenhar() {
    this.g.clear();
    this.frente.clear();
    for (const s of this.bonecos) s.destroy();
    this.bonecos = [];
    this.cameras.main.setBackgroundColor('#cfefff');
    const nos = layoutNos(this.scale.width);
    const atual = ORDEM.find((id) => liberada(id) && !api.vencidas.includes(id)) || 'campo';
    this.g.lineStyle(4, 0x193337, 1);
    this.g.beginPath();
    this.g.moveTo(nos[0].x, nos[0].y);
    for (const n of nos.slice(1)) this.g.lineTo(n.x, n.y);
    this.g.strokePath();
    this.g.fillStyle(0xf5f2e8, 1);
    for (let i = 0; i < nos.length - 1; i++) {
      const a = nos[i];
      const b = nos[i + 1];
      for (let t = 0.2; t < 1; t += 0.2) this.g.fillCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 2);
    }
    const icones = { campo: 'samuel/parado_0', floresta: 'bandeira/tremular_0', caverna: 'morcego/voar_0' };
    nos.forEach((n, i) => {
      const aberto = liberada(n.id);
      const vencido = api.vencidas.includes(n.id);
      const corrente = n.id === atual;
      const raio = n.w / 2;
      this.g.fillStyle(vencido ? 0xb9ed80 : aberto ? 0xfffdf7 : 0xd5d0c4, 1);
      this.g.fillCircle(n.x, n.y, raio);
      this.g.lineStyle(corrente ? 5 : 3, corrente ? 0xff9d52 : 0x193337, 1);
      this.g.strokeCircle(n.x, n.y, raio);
      if (corrente) {
        this.frente.fillStyle(0xff9d52, 1);
        this.frente.fillTriangle(n.x, n.y - raio - 16, n.x - 7, n.y - raio - 6, n.x + 7, n.y - raio - 6);
      }
      const escala = n.id === 'campo' ? 0.42 : n.id === 'floresta' ? 0.32 : 0.7;
      const icone = this.add.image(n.x, n.y + 6, 'atlas', icones[n.id]).setScale(escala).setDepth(2);
      this.bonecos.push(icone);
      const numero = this.add.image(n.x, n.y - 12, 'digitos', i + 1).setScale(1.4).setDepth(3);
      this.bonecos.push(numero);
      if (!aberto) this.cadeado(n.x, n.y + 2);
      else if (vencido) {
        this.visto(n.x + raio - 10, n.y - raio + 10);
        const ganhos = Math.max(0, Math.min(3, api.estrelasPorFase[n.id] || 0));
        for (let s = 0; s < 3; s++) {
          const estrela = this.add.image(n.x - 11 + s * 11, n.y + raio - 8, 'atlas', s < ganhos ? 'estrela/brilhar_0' : 'estrela/apagada_0').setScale(0.5).setDepth(4);
          this.bonecos.push(estrela);
        }
      }
    });
  }

  cadeado(x, y) {
    this.frente.fillStyle(0x193337, 1);
    this.frente.fillRect(x - 6, y - 2, 12, 9);
    this.frente.lineStyle(2, 0x193337, 1);
    this.frente.strokeCircle(x, y - 5, 3);
  }

  visto(x, y) {
    this.frente.lineStyle(3, 0x326344, 1);
    this.frente.beginPath();
    this.frente.moveTo(x - 6, y);
    this.frente.lineTo(x - 2, y + 4);
    this.frente.lineTo(x + 6, y - 5);
    this.frente.strokePath();
  }
}

class Fase extends Phaser.Scene {
  constructor() { super('fase'); }

  create(data) {
    this.id = data.id;
    this.venceu = false;
    this.coyote = 0;
    this.buffer = 0;
    this.puloAntes = false;
    this.segurou = false;
    this.impulsoAte = 0;
    this.danoAte = 0;
    this.noChaoAntes = false;
    this.alvoSX = 1;
    this.alvoSY = 1;
    this.squash = 0;
    this.proxPoeira = 0;
    this.invencivel = 0;
    api.tela = 'fase';
    api.fase = data.id;
    api.vidas = CONFIG.vidas;
    api.moedas = 0;
    api.estrelas = 0;
    api.derrotados = 0;
    api.pausado = false;
    this.marcoSprite = null;
    this.castelo = null;
    this.congelada = false;
    this.physics.world.gravity.y = CONFIG.gravidade;
    this.physics.resume();

    const map = this.make.tilemap({ key: data.id });
    this.map = map;
    const tiles = map.addTilesetImage('tiles', 'tiles');
    this.fundos = [];
    FUNDOS[data.id].forEach((item, i) => {
      const [, , fator, ancora, extra, h] = item;
      const y = ancora === 'topo' ? extra : CONFIG.altura + extra;
      const img = this.add.tileSprite(0, y, this.scale.width, h, item[0]);
      img.setOrigin(0, ancora === 'topo' ? 0 : 1).setScrollFactor(0).setDepth(i);
      this.fundos.push({ img, fator, h });
    });
    const fundo = map.createLayer('fundo', tiles, 0, 0).setDepth(8);
    this.solido = map.createLayer('solido', tiles, 0, 0).setDepth(9);
    fundo.setScrollFactor(1);
    this.solido.setCollision([...GIDS_SOLIDO, ...GIDS_PLATAFORMA, GID_QUEDA]);

    this.physics.world.setBounds(0, -120, map.widthInPixels, map.heightInPixels + 240);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.inimigos = this.physics.add.group();
    this.moedas = this.physics.add.staticGroup();
    this.estrelas = this.physics.add.staticGroup();
    this.blocos = [];
    this.plataformas = [];
    this.molas = [];
    this.checkpoint = null;
    this.spawn = { x: 48, y: 191 };
    this.metaX = map.widthInPixels - 40;

    const quedas = [];
    this.solido.forEachTile((tile) => { if (tile.index === GID_QUEDA) quedas.push(tile); });
    for (const tile of quedas) {
      const bloco = this.physics.add.sprite(tile.getCenterX(), tile.getCenterY(), 'pecas', GID_QUEDA - 1);
      bloco.setImmovable(true);
      bloco.body.setAllowGravity(false);
      bloco.body.setSize(16, 16, true);
      bloco.setData({ ox: bloco.x, oy: bloco.y, peso: 0, caindo: false });
      bloco.setDepth(12);
      this.blocos.push(bloco);
      this.solido.removeTileAt(tile.x, tile.y);
    }

    const props = (o) => {
      const m = {};
      for (const p of o.properties || []) m[p.name] = p.value;
      return m;
    };
    for (const o of map.getObjectLayer('objetos').objects) {
      const p = props(o);
      const cx = o.x + (o.width || 0) / 2;
      const pe = o.y + (o.height || 0);
      const meio = o.y + (o.height || 0) / 2;
      if (o.type === 'spawn') this.spawn = { x: cx, y: pe };
      else if (o.type === 'checkpoint') this.armarMarco(cx, pe);
      else if (o.type === 'meta') this.criarMeta(cx, pe);
      else if (o.type === 'moeda') this.criarMoeda(cx, meio);
      else if (o.type === 'estrela') this.criarEstrela(cx, meio);
      else if (o.type === 'cogumelo') this.criarMola(cx, pe);
      else if (o.type === 'plataforma') this.criarPlataforma(cx, meio, o.width, o.height, p);
      else if (o.type === 'inimigo') this.criarInimigo(p.tipo, cx, p.tipo === 'morcego' ? meio : pe, p);
    }
    if (!this.checkpoint) this.checkpoint = { x: this.spawn.x, y: this.spawn.y };
    this.ponto = this.spawn;
    this.marcoAtivo = false;
    this.ultimoChao = { x: this.spawn.x, y: this.spawn.y };

    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y - 1, 'atlas', 'samuel/parado_0');
    this.player.setOrigin(0.5, 1).setDepth(15).setCollideWorldBounds(true);
    this.player.setMaxVelocity(CONFIG.corrida + 40, 560);
    ajustarCorpo(this.player, CONFIG.hitbox.largura, CONFIG.hitbox.altura);
    this.dog = this.add.sprite(this.spawn.x - 26, this.spawn.y, 'atlas', 'doguinho/parado_0').setOrigin(0.5, 1).setDepth(14);
    this.dog.play('doguinho/parado');

    this.physics.add.collider(this.player, this.solido, null, (ator, tile) => this.passaPlataforma(ator, tile));
    this.physics.add.collider(this.inimigos, this.solido, null, (_ini, tile) => tile && tile.index > 0 && SOLIDO.has(tile.index));
    this.physics.add.overlap(this.player, this.inimigos, (a, b) => this.encostar(a, b));
    this.physics.add.collider(this.player, this.blocos);
    for (const plat of this.plataformas) {
      this.physics.add.collider(this.player, plat, null, (ator, corpo) => this.passaCorpo(ator, corpo));
    }
    this.physics.add.overlap(this.player, this.moedas, (_a, moeda) => this.pegarMoeda(moeda));
    this.physics.add.overlap(this.player, this.estrelas, (_a, estrela) => this.pegarEstrela(estrela));
    this.physics.add.overlap(this.player, this.zonaMeta, () => this.vencer());
    if (this.zonaMarco) {
      this.physics.add.overlap(this.player, this.zonaMarco, () => {
        if (this.marcoAtivo) return;
        this.marcoAtivo = true;
        this.ponto = { x: this.checkpoint.x, y: this.checkpoint.y };
        this.desenharMarco();
      });
    }
    for (const mola of this.molas) this.physics.add.overlap(this.player, mola, () => this.saltarMola(mola));

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, CONFIG.cameraLerp, CONFIG.cameraLerp);
    this.cameras.main.setBackgroundColor(data.id === 'caverna' ? '#223841' : '#cfefff');

    this.coracoes = [];
    for (let i = 0; i < CONFIG.vidas; i++) {
      this.coracoes.push(this.add.image(6 + i * 16, 6, 'coracao').setOrigin(0, 0).setScrollFactor(0).setDepth(40));
    }
    this.add.image(6, 23, 'atlas', 'moeda/girar_0').setOrigin(0, 0).setScrollFactor(0).setDepth(40);
    this.digitoA = this.add.image(24, 25, 'digitos', 0).setOrigin(0, 0).setScrollFactor(0).setDepth(40);
    this.digitoB = this.add.image(32, 25, 'digitos', 0).setOrigin(0, 0).setScrollFactor(0).setDepth(40);
    const marcaCaverna = this.id === 'caverna';
    this.marca = this.add.sprite(0, 0, 'atlas', marcaCaverna ? 'castelinho/parado_0' : 'bandeira/tremular_0').setScrollFactor(0).setDepth(40).setScale(marcaCaverna ? 0.34 : 0.5).setOrigin(0.5, 0.5);
    if (!marcaCaverna) this.marca.play('bandeira/tremular');
    this.desenharMarco();
    this.atualizarHud();
    this.scale.on('resize', (tamanho) => {
      this.cameras.main.setSize(tamanho.width, tamanho.height);
      for (const f of this.fundos) f.img.setSize(tamanho.width, f.h);
    });
    this.prova = data.prova || null;
    this.molaDisparou = false;
    if (this.prova) this.time.delayedCall(80, () => this.montarProva(this.prova));
    this.events.once('shutdown', () => {
      this.player = null;
      this.dog = null;
      this.marcoSprite = null;
      this.castelo = null;
    });
  }

  passaPlataforma(ator, tile) {
    if (!tile || tile.index <= 0) return false;
    if (!PLAT.has(tile.index)) return true;
    return ator.body.velocity.y >= 0 && ator.body.bottom - ator.body.deltaY() <= tile.pixelY + 8;
  }

  passaCorpo(ator, corpo) {
    return ator.body.velocity.y >= 0 && ator.body.bottom - ator.body.deltaY() <= corpo.body.top + 8;
  }

  criarMeta(x, pe) {
    this.metaX = x;
    if (this.id === 'caverna') this.desenharCastelo(x, pe);
    else {
      const poste = this.add.sprite(x, pe, 'atlas', 'bandeira/tremular_0').setOrigin(0.5, 1).setDepth(11);
      poste.play('bandeira/tremular');
    }
    this.zonaMeta = this.add.zone(x, pe - 28, 36, 64);
    this.zonaMeta.setOrigin(0.5, 0.5);
    this.physics.add.existing(this.zonaMeta, true);
  }

  desenharCastelo(x, pe) {
    this.castelo = this.add.sprite(x, pe, 'atlas', 'castelinho/parado_0').setOrigin(0.5, 1).setDepth(11);
    this.castelo.play('castelinho/parado');
  }

  criarMoeda(x, y) {
    const s = this.moedas.create(x, y, 'atlas', 'moeda/girar_0');
    s.setDepth(12).play('moeda/girar');
    s.body.setSize(12, 12);
    s.refreshBody();
  }

  criarEstrela(x, y) {
    const s = this.estrelas.create(x, y, 'atlas', 'estrela/brilhar_0');
    s.setDepth(12).play('estrela/brilhar');
    s.body.setSize(12, 12);
    s.refreshBody();
  }

  criarMola(x, pe) {
    const s = this.physics.add.sprite(x, pe, 'atlas', 'cogumelo/mola_0');
    s.setOrigin(0.5, 1).setDepth(12);
    s.body.setAllowGravity(false).setImmovable(true);
    ajustarCorpo(s, 20, 16);
    s.setData('prox', 0);
    this.molas.push(s);
  }

  criarPlataforma(x, y, w, h, p) {
    const s = this.physics.add.sprite(x, y, 'atlas', 'plataforma/helice_0');
    s.setDepth(12).play('plataforma/helice');
    s.body.setAllowGravity(false).setImmovable(true);
    s.body.setSize(w || 48, h || 16, true);
    s.setData({ ox: x, oy: y, eixo: p.eixo || 'x', curso: p.curso || 24, periodo: p.periodo || 3 });
    this.plataformas.push(s);
  }

  criarInimigo(tipo, x, y, p) {
    const quadro = tipo === 'morcego' ? 'morcego/voar_0' : `${tipo}/andar_0`;
    const s = this.inimigos.create(x, y, 'atlas', quadro);
    s.setDepth(13);
    s.setData({
      vivo: true,
      tipo,
      dir: p.dir || 1,
      minX: p.minX ?? x - 40,
      maxX: p.maxX ?? x + 40,
      baseY: y,
    });
    if (tipo === 'morcego') {
      s.setOrigin(0.5, 0.5);
      s.body.setAllowGravity(false);
      ajustarCorpo(s, 18, 12);
      s.play('morcego/voar');
    } else {
      s.setOrigin(0.5, 1);
      ajustarCorpo(s, tipo === 'besouro' ? 16 : 18, 14);
      s.play(`${tipo}/andar`);
    }
  }

  armarMarco(x, pe) {
    this.checkpoint = { x, y: pe };
    this.zonaMarco = this.add.zone(x, pe - 16, 28, 36);
    this.zonaMarco.setOrigin(0.5, 0.5);
    this.physics.add.existing(this.zonaMarco, true);
  }

  desenharMarco() {
    if (!this.marcoSprite?.active) {
      this.marcoSprite = this.add.sprite(this.checkpoint.x, this.checkpoint.y, 'atlas', 'marco/apagado_0').setOrigin(0.5, 1).setDepth(11);
    }
    animar(this.marcoSprite, this.marcoAtivo ? 'marco/aceso' : 'marco/apagado');
  }

  atualizarHud() {
    this.coracoes.forEach((c, i) => c.setTexture(i < api.vidas ? 'coracao' : 'coracao-vazio'));
    const n = Math.max(0, Math.min(99, api.moedas));
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    this.digitoA.setFrame(dezena).setVisible(n >= 10);
    this.digitoB.setFrame(unidade);
    this.digitoB.x = n >= 10 ? 32 : 24;
  }

  olhar() {
    const p = this.player;
    if (!p || !p.body) {
      return { tela: api.tela, fase: this.id, pular: false, x: 0, y: 0, vx: 0, vy: 0, noChao: false, vidas: api.vidas, moedas: api.moedas, derrotados: api.derrotados, modo: api.modo };
    }
    const pe = p.body.bottom;
    const frente = p.x + 20;
    const tileParede = this.solido.getTileAtWorldXY(frente, pe - 12, true);
    const parede = !!(tileParede && SOLIDO.has(tileParede.index));
    const chao = this.temChao(frente, pe + 6);
    let inimigoDx = null;
    for (const ini of this.inimigos.getChildren()) {
      if (!ini.getData('vivo') || ini.getData('tipo') === 'morcego') continue;
      const dx = ini.x - p.x;
      if (dx > -36 && dx < 32 && Math.abs(ini.y - p.y) < 34) {
        if (inimigoDx === null || Math.abs(dx) < Math.abs(inimigoDx)) inimigoDx = dx;
      }
    }
    const noChao = p.body.blocked.down || p.body.touching.down;
    let pulo = false;
    if (inimigoDx !== null && Math.abs(inimigoDx) <= 30 && Math.abs(inimigoDx) >= 8 && noChao) pulo = inimigoDx < 0 ? 'volta' : 'curto';
    else if ((parede || !chao) && (noChao || this.coyote > 0)) pulo = 'alto';
    return {
      tela: api.tela, fase: this.id, pular: pulo, prova: this.prova || null,
      x: p.x, y: p.y, pe: p.body.bottom,
      vx: p.body.velocity.x, vy: p.body.velocity.y, noChao,
      vidas: api.vidas, moedas: api.moedas, estrelas: api.estrelas,
      derrotados: api.derrotados, derrotadosTotal: api.derrotadosTotal || 0, modo: api.modo,
      largura: this.scale.width, altura: this.scale.height,
      mola: !!this.molaDisparou,
      plataformaDelta: this.plataformas[0] ? this.plataformas[0].x - this.plataformas[0].getData('ox') : 0,
      blocoCaindo: this.blocos.some((b) => b.active && b.getData('caindo')),
      blocoQueda: this.blocos[0] && this.blocos[0].active ? this.blocos[0].y - (this.blocos[0].getData('oy') || this.blocos[0].y) : 0,
      tipos: this.inimigos.getChildren().filter((i) => i.active && i.getData('vivo')).map((i) => i.getData('tipo')),
    };
  }

  temChao(x, y) {
    const tile = this.solido.getTileAtWorldXY(x, y, true);
    if (tile && (SOLIDO.has(tile.index) || PLAT.has(tile.index))) return true;
    for (const b of this.blocos) {
      if (!b.active || b.getData('caindo')) continue;
      if (x >= b.body.left && x <= b.body.right && y >= b.body.top - 2 && y <= b.body.bottom + 4) return true;
    }
    for (const plat of this.plataformas) {
      if (x >= plat.body.left && x <= plat.body.right && y >= plat.body.top - 2 && y <= plat.body.bottom + 4) return true;
    }
    return false;
  }

  pegarMoeda(moeda) {
    moeda.destroy();
    api.moedas += 1;
    this.atualizarHud();
    tocar('moeda');
    estouro(this, moeda.x, moeda.y, 'brilho/piscar', 4);
  }

  pegarEstrela(estrela) {
    estrela.destroy();
    api.estrelas += 1;
    tocar('moeda');
    estouro(this, estrela.x, estrela.y, 'brilho/piscar', 4);
  }

  saltarMola(mola) {
    if (this.time.now < mola.getData('prox')) return;
    if (this.player.body.velocity.y < -20 && this.player.body.bottom < mola.body.top) return;
    mola.setData('prox', this.time.now + 420);
    this.molaDisparou = true;
    mola.play('cogumelo/mola');
    mola.once('animationcomplete', () => mola.setFrame('cogumelo/mola_0'));
    this.player.body.setVelocityY(CONFIG.puloAlto);
    this.impulsoAte = this.time.now + 180;
    this.segurou = false;
    this.pulso(0.84, 1.18);
    tocar('pulo');
  }

  encostar(a, b) {
    const p = a === this.player ? a : b;
    const ini = p === a ? b : a;
    if (!ini.getData || !ini.getData('vivo') || this.venceu) return;
    const tipo = classificarContato(
      { pe: p.body.bottom, altura: p.body.height, vy: p.body.velocity.y, esquerda: p.body.left, direita: p.body.right },
      { topo: ini.body.top, base: ini.body.bottom, esquerda: ini.body.left, direita: ini.body.right },
    );
    if (tipo === 'pisa') this.pisar(ini);
    else if (tipo === 'lado') this.lado(p, ini);
  }

  pisar(ini) {
    ini.setData('vivo', false);
    ini.body.enable = false;
    ini.setVelocity(0, 0);
    ini.setFrame(`${ini.getData('tipo')}/pof_0`);
    this.player.body.setVelocityY(-210);
    this.segurou = false;
    api.derrotados += 1;
    api.derrotadosTotal = (api.derrotadosTotal || 0) + 1;
    if (ini.anims) ini.anims.stop();
    tocar('pof');
    const efeito = this.add.sprite(ini.x, ini.y - 8, 'atlas').setDepth(30);
    efeito.play('pof/estourar');
    efeito.once('animationcomplete', () => efeito.destroy());
    estouro(this, ini.x, ini.y - 12, 'brilho/piscar', 3);
    this.time.delayedCall(320, () => ini.destroy());
  }

  lado(p, ini) {
    const sinal = p.x < ini.x ? -1 : 1;
    if (decidirContato(api.modo) === 'empurra' || this.invencivel > 0) {
      p.body.setVelocity(sinal * 130, Math.min(p.body.velocity.y, -70));
      return;
    }
    api.vidas = aoZerarVidas(api.vidas - 1);
    const zerou = api.vidas === CONFIG.vidas;
    this.invencivel = CONFIG.invencivel;
    this.danoAte = this.time.now + 220;
    this.atualizarHud();
    tocar('dano');
    p.body.setVelocity(sinal * 120, -150);
    if (zerou) this.renascer(this.ponto);
  }

  cairNoBuraco() {
    if (decidirBuraco(api.modo) === 'plataforma') {
      this.player.setPosition(this.ultimoChao.x, this.ultimoChao.y - 1);
      this.player.body.setVelocity(0, 0);
      return;
    }
    api.vidas = aoZerarVidas(api.vidas - 1);
    this.invencivel = CONFIG.invencivel;
    this.atualizarHud();
    tocar('dano');
    this.renascer(this.ponto);
  }

  renascer(ponto) {
    this.player.setPosition(ponto.x, ponto.y - 1);
    this.player.body.setVelocity(0, 0);
    this.dog.setPosition(ponto.x - 24, ponto.y);
  }

  vencer() {
    if (this.venceu || api.pausado) return;
    this.venceu = true;
    if (!api.vencidas.includes(this.id)) api.vencidas.push(this.id);
    api.estrelasPorFase[this.id] = api.estrelas;
    salvar();
    atualizarTravas();
    this.physics.pause();
    this.player.setScale(1, 1);
    this.player.setFlipX(false);
    this.player.anims.stop();
    this.player.setOrigin(0.5, 1);
    this.player.setTexture('atlas', 'samuel/comemorar_0');
    animar(this.castelo, 'castelinho/brilhar');
    animar(this.dog, 'doguinho/comemorar');
    this.cameras.main.stopFollow();
    const limite = Math.max(0, this.map.widthInPixels - this.scale.width);
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.player.x - this.scale.width * 0.68, 0, limite);
    tocar('vitoria');
    estouro(this, this.player.x, this.player.y - 36, 'brilho/piscar', 6);
    mostrarVitoria(api.moedas, api.estrelas, !!proximaFase(this.id));
  }

  montarProva(qual) {
    this.prova = qual;
    const cam = this.cameras.main;
    cam.stopFollow();
    if (qual === 'mola' && this.molas[0]) {
      const m = this.molas[0];
      this.player.setPosition(m.x, m.y - 28);
      this.player.body.setVelocity(0, 120);
      cam.centerOn(m.x, m.y - 48);
    } else if (qual === 'plataforma' && this.plataformas[0]) {
      const plat = this.plataformas[0];
      this.player.setPosition(plat.x, plat.body.top);
      this.player.body.setVelocity(0, 0);
      cam.centerOn(plat.x, plat.y - 20);
    } else if (qual === 'bloco' && this.blocos[0]) {
      const b = this.blocos[0];
      this.player.setPosition(b.x, b.y - 20);
      this.player.body.setVelocity(0, 0);
      cam.centerOn(b.x, b.y - 40);
    } else if (qual === 'inimigos') {
      const chao = 191;
      const base = 220;
      const porTipo = (tipo, x) => {
        const ini = this.inimigos.getChildren().find((i) => i.getData('tipo') === tipo && i.getData('vivo'));
        if (!ini) return;
        ini.setPosition(x, chao);
        ini.body.reset(x, chao);
      };
      porTipo('lesma', base - 56);
      porTipo('besouro', base + 58);
      this.player.setPosition(base, chao - 1);
      this.player.body.setVelocity(0, 0);
      this.dog.setPosition(base - 90, chao);
      cam.centerOn(base, 168);
    }
  }

  pulso(sx, sy) { this.alvoSX = sx; this.alvoSY = sy; this.squash = 0.1; }

  poeira() {
    const s = this.add.sprite(this.player.x - (this.player.flipX ? -8 : 8), this.player.body.bottom, 'atlas').setOrigin(0.5, 1).setDepth(10);
    s.play('poeira/sumir');
    s.once('animationcomplete', () => s.destroy());
  }

  update(time, delta) {
    const p = this.player;
    if (this.congelada || !p || !p.body || this.venceu) {
      this.rolarFundos();
      return;
    }
    const dt = Math.min(delta, 40) / 1000;
    if (api.pausado) return;
    if (this.prova === 'plataforma' && this.plataformas[0]) {
      const plat = this.plataformas[0];
      p.x = plat.x;
      p.y = plat.body.top + 1;
      p.body.setVelocity(0, 0);
      this.cameras.main.centerOn(plat.x, plat.y - 24);
    } else if (this.prova === 'bloco' && this.blocos[0]) {
      const b = this.blocos[0];
      if (!b.getData('caindo')) {
        p.x = b.x;
        if (p.y > b.y - 16) p.y = b.y - 18;
        p.body.setVelocity(0, 40);
      }
      this.cameras.main.centerOn(b.x, Math.max(150, Math.min(b.y - 8, 210)));
    }
    if (this.invencivel > 0) this.invencivel -= dt;

    for (const plat of this.plataformas) {
      const d = plat.getData('eixo') === 'y' ? 'y' : 'x';
      const origem = d === 'y' ? plat.getData('oy') : plat.getData('ox');
      const atual = d === 'y' ? plat.y : plat.x;
      const alvo = origem + Math.sin((time / 1000 / plat.getData('periodo')) * Math.PI * 2) * plat.getData('curso');
      plat.body.setVelocity(d === 'x' ? (alvo - atual) / Math.max(dt, 0.008) : 0, d === 'y' ? (alvo - atual) / Math.max(dt, 0.008) : 0);
    }
    for (const ini of this.inimigos.getChildren()) {
      if (!ini.active || !ini.getData('vivo')) continue;
      this.andarInimigo(ini, dt, time);
    }
    for (const b of this.blocos) this.andarBloco(b, dt, time);

    const noChao = p.body.blocked.down || p.body.touching.down;
    if (noChao && !this.noChaoAntes) this.pulso(1.14, 0.82);
    this.noChaoAntes = noChao;
    if (noChao) {
      this.coyote = CONFIG.coyote;
      this.ultimoChao = { x: p.x, y: p.y };
    } else this.coyote -= dt;

    const pulo = entrada.pulo || !!teclas.Space || !!teclas.ArrowUp || !!teclas.KeyZ || !!teclas.KeyW;
    if (time >= this.impulsoAte) {
      if (pulo && !this.puloAntes) this.buffer = CONFIG.buffer;
      if (this.buffer > 0) {
        this.buffer -= dt;
        if (this.coyote > 0) {
          p.body.setVelocityY(CONFIG.pulo);
          this.coyote = 0;
          this.buffer = 0;
          this.segurou = true;
          this.pulso(0.86, 1.16);
          tocar('pulo');
        }
      }
      if (!pulo && this.segurou) {
        p.body.setVelocityY(cortarPulo(p.body.velocity.y, false));
        this.segurou = false;
      }
    }
    this.puloAntes = pulo;

    let alvo = 0;
    if (entrada.esq || teclas.ArrowLeft || teclas.KeyA) alvo = -CONFIG.corrida;
    else if (entrada.dir || teclas.ArrowRight || teclas.KeyD) alvo = CONFIG.corrida;
    const taxa = noChao ? 0.55 : 0.35;
    p.body.setVelocityX(p.body.velocity.x + (alvo - p.body.velocity.x) * taxa);
    if (alvo < 0) p.setFlipX(true);
    else if (alvo > 0) p.setFlipX(false);

    if (this.squash > 0) {
      this.squash -= dt;
      p.setScale(this.alvoSX, this.alvoSY);
      if (this.squash <= 0) { this.alvoSX = 1; this.alvoSY = 1; }
    } else {
      p.setScale(p.scaleX + (1 - p.scaleX) * 0.35, p.scaleY + (1 - p.scaleY) * 0.35);
    }
    ajustarCorpo(p, CONFIG.hitbox.largura, CONFIG.hitbox.altura);

    if (time < this.danoAte) animar(p, 'samuel/dano');
    else if (!noChao && p.body.velocity.y < 0) animar(p, 'samuel/pular');
    else if (!noChao) animar(p, 'samuel/cair');
    else if (Math.abs(p.body.velocity.x) > 12) animar(p, 'samuel/correr');
    else animar(p, 'samuel/parado');
    p.setAlpha(this.invencivel > 0 && Math.floor(time / 80) % 2 === 0 ? 0.4 : 1);

    if (noChao && Math.abs(p.body.velocity.x) > 20 && time > this.proxPoeira) {
      this.proxPoeira = time + 90;
      this.poeira();
    }
    const alvoDog = p.x - (p.flipX ? -26 : 26);
    this.dog.x += (alvoDog - this.dog.x) * 0.12;
    this.dog.y += (p.y - this.dog.y) * 0.2;
    this.dog.setFlipX(this.dog.x > p.x);
    animar(this.dog, !noChao ? 'doguinho/pular' : Math.abs(alvoDog - this.dog.x) > 6 ? 'doguinho/correr' : 'doguinho/parado');

    if (p.y > this.map.heightInPixels + 6) this.cairNoBuraco();
    this.rolarFundos();
    const cam = this.cameras.main;
    const fora = this.metaX < cam.scrollX + 12 || this.metaX > cam.scrollX + cam.width - 12;
    this.marca.setVisible(fora);
    if (fora) {
      const direita = this.metaX > cam.midPoint.x;
      this.marca.setFlipX(!direita);
      this.marca.setPosition(direita ? cam.width - 18 : 18, cam.height * 0.42);
    }
  }

  rolarFundos() {
    const x = this.cameras.main.scrollX;
    for (const f of this.fundos) f.img.tilePositionX = x * f.fator;
  }

  andarInimigo(ini, dt, time) {
    let dir = ini.getData('dir');
    if (ini.getData('tipo') === 'morcego') {
      ini.x += dir * CONFIG.morcego * dt;
      ini.y = ini.getData('baseY') + Math.sin(time / 280 + ini.x * 0.02) * 8;
      if (ini.x < ini.getData('minX') || ini.x > ini.getData('maxX')) {
        dir *= -1;
        ini.setData('dir', dir);
      }
      ini.setFlipX(dir < 0);
      ini.body.reset(ini.x, ini.y);
      return;
    }
    const vel = ini.getData('tipo') === 'besouro' ? CONFIG.besouro : CONFIG.lesma;
    if (ini.x < ini.getData('minX')) dir = 1;
    else if (ini.x > ini.getData('maxX')) dir = -1;
    else if (ini.body.blocked.left) dir = 1;
    else if (ini.body.blocked.right) dir = -1;
    else {
      const frente = ini.x + dir * 14;
      const chao = this.solido.getTileAtWorldXY(frente, ini.body.bottom + 4, true);
      if (!chao || !SOLIDO.has(chao.index)) {
        dir *= -1;
        ini.x += dir * 6;
      }
    }
    ini.setData('dir', dir);
    ini.body.setVelocityX(dir * vel);
    ini.setFlipX(dir < 0);
  }

  andarBloco(b, dt, time) {
    if (b.getData('caindo')) {
      if (b.y > this.map.heightInPixels + 32) b.destroy();
      return;
    }
    const p = this.player;
    const emCima = p.body.velocity.y >= 0 && p.body.bottom <= b.body.top + 8 && p.body.right > b.body.left + 2 && p.body.left < b.body.right - 2;
    b.setData('peso', emCima ? b.getData('peso') + dt : 0);
    if (b.getData('peso') > 0.28) b.x = b.getData('ox') + Math.sin(time / 28) * 1;
    else b.x = b.getData('ox');
    if (b.getData('peso') > CONFIG.blocoEspera) {
      b.setData('caindo', true);
      b.body.setImmovable(false);
      b.body.setAllowGravity(true);
      b.setDepth(8);
    }
  }

  soltarNoBuraco() {
    if (!this.player) return;
    this.player.y = this.map.heightInPixels + 24;
    this.player.body.setVelocity(0, 40);
  }

  porNoInimigo() {
    const ini = this.inimigos.getChildren().find((i) => i.active && i.getData('vivo') && i.getData('tipo') !== 'morcego');
    if (!ini || !this.player) return false;
    this.invencivel = 0;
    this.player.setPosition(ini.x, ini.y);
    this.player.body.setVelocity(0, 0);
    return true;
  }
}

api.olhar = () => {
  const cena = faseAtiva();
  if (!cena) {
    return { tela: api.tela, fase: api.fase, pular: false, x: 0, y: 0, vx: 0, vy: 0, noChao: false, vidas: api.vidas, moedas: api.moedas, derrotados: api.derrotados, modo: api.modo, estrelas: api.estrelas };
  }
  return cena.olhar();
};
api.provar = (qual) => {
  const fase = qual === 'mola' || qual === 'plataforma' ? 'floresta' : 'caverna';
  limparVitoria();
  mostrar(painelPausa, false);
  api.pausado = false;
  api.fase = fase;
  faixas(false);
  mostrar(barra, false);
  controlesDeFase(true);
  const jogo = api.jogo;
  if (jogo.scene.isActive('fase')) jogo.scene.stop('fase');
  if (jogo.scene.isActive('mapa')) jogo.scene.stop('mapa');
  jogo.scene.start('fase', { id: fase, prova: qual });
  api.tela = 'fase';
};
api.congelar = () => {
  const cena = faseAtiva();
  if (!cena || cena.congelada) return;
  cena.congelada = true;
  cena.physics.pause();
};
api.soltarNoBuraco = () => faseAtiva()?.soltarNoBuraco();
api.porNoInimigo = () => faseAtiva()?.porNoInimigo() ?? false;
api.estado = () => api.olhar();

prender(btnEsq, 'esq');
prender(btnDir, 'dir');
prender(btnPulo, 'pulo');
btnPausa.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); pausar(!api.pausado); });
btnTela.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); alternarTela(); });
btnSeguir.addEventListener('pointerdown', (e) => { e.preventDefault(); pausar(false); });
btnCampo.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); comecar('campo'); });
btnFloresta.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); comecar('floresta'); });
btnCaverna.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); comecar('caverna'); });
btnNormal.addEventListener('pointerdown', (e) => { e.preventDefault(); definirModo('normal'); });
btnFacil.addEventListener('pointerdown', (e) => { e.preventDefault(); definirModo('facil'); });
btnRepetir.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); comecar(api.fase); });
btnProxima.addEventListener('pointerdown', (e) => { e.preventDefault(); prepararSom(); irProxima(); });

addEventListener('keydown', (e) => {
  teclas[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyP' || e.code === 'Escape') pausar(e.code === 'Escape' ? true : !api.pausado);
  if (e.code === 'KeyF') alternarTela();
});
addEventListener('keyup', (e) => { teclas[e.code] = false; });
document.addEventListener('fullscreenchange', sincronizarTela);
document.addEventListener('webkitfullscreenchange', sincronizarTela);
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(true); });
new ResizeObserver(() => layout()).observe($('palco'));

carregar();
atualizarTravas();
const inicial = medida(window.innerWidth, window.innerHeight);
api.jogo = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'palco',
  width: inicial.largura,
  height: inicial.altura,
  pixelArt: true,
  banner: false,
  backgroundColor: '#cfefff',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, autoRound: true },
  render: { pixelArt: true, antialias: false, roundPixels: true },
  physics: { default: 'arcade', arcade: { gravity: { y: CONFIG.gravidade }, debug: false } },
  scene: [Boot, Mapa, Fase],
});
addEventListener('resize', () => {
  if (!api.jogo) return;
  const m = medida(window.innerWidth, window.innerHeight);
  if (api.jogo.scale.width !== m.largura || api.jogo.scale.height !== m.altura) api.jogo.scale.setGameSize(m.largura, m.altura);
  api.jogo.scale.refresh();
  requestAnimationFrame(layout);
});

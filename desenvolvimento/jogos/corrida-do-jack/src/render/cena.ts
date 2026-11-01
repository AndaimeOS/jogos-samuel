// Cena 3D da Corrida do Jack com ARTE PROVISÓRIA feita em código (formas simples nas cores do kit).
// Na etapa 2 os modelos comprados (Synty + pets encomendados) entram no lugar de `criarCrianca`, `criarCachorro`,
// `criarObstaculo`, `criarMoeda` e dos prédios, sem mexer nas regras (src/core/regras.ts).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FAIXAS, FORMA, type Corrida, type Tipo } from '../core/regras';

const TRECHO = 40;          // comprimento de cada pedaço de cenário reciclado
const TRECHOS = 6;
const COR = { ceu: 0xa9dcf2, rua: 0x5b6670, faixa: 0xf5f2e8, calcada: 0xd9cbb4, grama: 0x7cc35a, tinta: 0x193337 };
const PREDIOS = [0xff9d52, 0xceb7ef, 0xb9ed80, 0xffd56b, 0x8fd3f0, 0xf5f2e8, 0xe98a8a];

const mat = (cor: number, opc: Partial<THREE.MeshLambertMaterialParameters> = {}) => new THREE.MeshLambertMaterial({ color: cor, ...opc });
const caixa = (l: number, a: number, p: number, cor: number) => new THREE.Mesh(new THREE.BoxGeometry(l, a, p), mat(cor));

function criarCrianca() {
  const g = new THREE.Group();
  const corpo = caixa(0.62, 0.7, 0.38, 0xff9d52); corpo.position.y = 1.05;            // jaqueta laranja
  const camiseta = caixa(0.3, 0.5, 0.02, 0xffd56b); camiseta.position.set(0, 1.05, 0.2);
  const cabeca = caixa(0.46, 0.46, 0.44, 0xf2c9a0); cabeca.position.y = 1.68;
  const cabelo = caixa(0.5, 0.16, 0.48, 0x5b3a22); cabelo.position.y = 1.95;
  const pernaE = caixa(0.22, 0.7, 0.26, 0x2f6e7a); pernaE.position.set(-0.15, 0.35, 0);  // calça azul-petróleo
  const pernaD = pernaE.clone(); pernaD.position.x = 0.15;
  const bracoE = caixa(0.16, 0.6, 0.2, 0xff9d52); bracoE.position.set(-0.42, 1.08, 0);
  const bracoD = bracoE.clone(); bracoD.position.x = 0.42;
  for (const p of [pernaE, pernaD, bracoE, bracoD]) p.geometry.translate(0, -0.25, 0), (p.position.y += 0.25);
  g.add(corpo, camiseta, cabeca, cabelo, pernaE, pernaD, bracoE, bracoD);
  return { g, pernaE, pernaD, bracoE, bracoD };
}

function criarCachorro() {   // Jack Russell branco com manchas marrons
  const g = new THREE.Group();
  const corpo = caixa(0.36, 0.34, 0.7, 0xf5f2e8); corpo.position.y = 0.42;
  const mancha = caixa(0.37, 0.2, 0.3, 0x8a5a3b); mancha.position.set(0, 0.5, -0.12);
  const cabeca = caixa(0.32, 0.3, 0.32, 0xf5f2e8); cabeca.position.set(0, 0.66, 0.42);
  const orelha = caixa(0.34, 0.1, 0.12, 0x8a5a3b); orelha.position.set(0, 0.84, 0.38);
  const focinho = caixa(0.16, 0.12, 0.12, 0x193337); focinho.position.set(0, 0.6, 0.62);
  const rabo = caixa(0.07, 0.24, 0.07, 0xf5f2e8); rabo.position.set(0, 0.66, -0.38); rabo.rotation.x = -0.6;
  const patas = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => { const p = caixa(0.09, 0.26, 0.09, 0xf5f2e8); p.position.set(sx * 0.12, 0.13, sz * 0.24); return p; }));
  g.add(corpo, mancha, cabeca, orelha, focinho, rabo, ...patas);
  return { g, rabo, patas };
}

function criarObstaculo(tipo: Tipo) {
  const g = new THREE.Group();
  const f = FORMA[tipo];
  if (tipo === 'baixo') {           // barreira listrada
    for (let i = 0; i < 4; i++) { const b = caixa(0.45, 0.32, 0.5, i % 2 ? 0xf5f2e8 : 0xd6333b); b.position.set(-0.68 + i * 0.45, 0.62, f.comprimento / 2); g.add(b); }
    for (const sx of [-0.8, 0.8]) { const p = caixa(0.12, 0.6, 0.12, 0x193337); p.position.set(sx, 0.3, f.comprimento / 2); g.add(p); }
  } else if (tipo === 'alto') {     // arco: passar abaixado
    const barra = caixa(2, 0.5, f.comprimento, 0xffd56b); barra.position.set(0, (f.y0 + f.y1) / 2 + 0.2, f.comprimento / 2);
    const faixa = caixa(2.02, 0.14, f.comprimento + 0.02, 0x193337); faixa.position.copy(barra.position);
    for (const sx of [-1, 1]) { const p = caixa(0.16, f.y1, 0.16, 0x193337); p.position.set(sx, f.y1 / 2, f.comprimento / 2); g.add(p); }
    g.add(barra, faixa);
  } else {                          // carrinho: trocar de faixa
    const cor = PREDIOS[Math.floor(Math.random() * 4)];
    const base = caixa(1.8, 1.1, f.comprimento, cor); base.position.set(0, 0.85, f.comprimento / 2);
    const cabine = caixa(1.6, 0.9, f.comprimento * 0.5, 0xcfeef7); cabine.position.set(0, 1.85, f.comprimento * 0.4);
    const teto = caixa(1.7, 0.12, f.comprimento * 0.55, cor); teto.position.set(0, 2.35, f.comprimento * 0.4);
    for (const sx of [-0.85, 0.85]) for (const sz of [0.6, f.comprimento - 0.6]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), mat(0x193337)); r.rotation.z = Math.PI / 2; r.position.set(sx, 0.34, sz); g.add(r);
    }
    g.add(base, cabine, teto);
  }
  return g;
}

const geoMoeda = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 18);
const matMoeda = new THREE.MeshLambertMaterial({ color: 0xffc83d, emissive: 0x6b4a00 });

/** Junta as malhas de um grupo por cor numa malha só por cor (um trecho de cidade vira ~10 chamadas de desenho). */
function fundirPorCor(g: THREE.Group) {
  g.updateMatrixWorld(true);
  const porCor = new Map<number, THREE.BufferGeometry[]>();
  g.traverse((n) => {
    const m = n as THREE.Mesh;
    if (!m.isMesh) return;
    const cor = (m.material as THREE.MeshLambertMaterial).color.getHex();
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const lista = porCor.get(cor) ?? [];
    lista.push(geo.index ? geo.toNonIndexed() : geo);
    porCor.set(cor, lista);
  });
  const fundido = new THREE.Group();
  for (const [cor, geos] of porCor) {
    for (const k of geos) { for (const nome of Object.keys(k.attributes)) if (nome !== 'position' && nome !== 'normal') k.deleteAttribute(nome); }
    fundido.add(new THREE.Mesh(mergeGeometries(geos), mat(cor)));
  }
  return fundido;
}

function criarTrecho(semente: number) {
  const g = new THREE.Group();
  const rua = new THREE.Mesh(new THREE.PlaneGeometry(7.6, TRECHO), mat(COR.rua)); rua.rotation.x = -Math.PI / 2; rua.position.z = TRECHO / 2;
  g.add(rua);
  for (const x of [-1.1, 1.1]) for (let z = 1; z < TRECHO; z += 4) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2), mat(COR.faixa)); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.01, z); g.add(l);
  }
  for (const lado of [-1, 1]) {
    const calcada = caixa(2.2, 0.18, TRECHO, COR.calcada); calcada.position.set(lado * 4.9, 0.09, TRECHO / 2);
    const grama = new THREE.Mesh(new THREE.PlaneGeometry(30, TRECHO), mat(COR.grama)); grama.rotation.x = -Math.PI / 2; grama.position.set(lado * 21, -0.01, TRECHO / 2);
    g.add(calcada, grama);
    let r = semente * 7 + (lado > 0 ? 3 : 0);
    const aleat = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let z = 2; z < TRECHO; z += 7 + aleat() * 3) {
      const alt = 3 + Math.floor(aleat() * 4) * 1.4, larg = 4 + aleat() * 2;
      const cor = PREDIOS[Math.floor(aleat() * PREDIOS.length)];
      const casa = caixa(larg, alt, 5.5, cor); casa.position.set(lado * (8.6 + larg / 2), alt / 2, z + 2.6);
      const telhado = caixa(larg + 0.3, 0.3, 5.8, COR.tinta); telhado.position.set(casa.position.x, alt + 0.15, z + 2.6);
      g.add(casa, telhado);
      for (let andar = 1.2; andar < alt - 0.6; andar += 1.4) for (const dz of [1.2, 3.8]) {
        const jan = caixa(0.06, 0.7, 0.9, 0xcfeef7); jan.position.set(lado * 8.57, andar, z + dz); g.add(jan);
      }
      if (aleat() < 0.5) {   // árvore na calçada
        const tronco = caixa(0.25, 1.2, 0.25, 0x8a5a3b); tronco.position.set(lado * 5.4, 0.6, z + 5.5);
        const copa = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), mat(0x4f9e3a)); copa.position.set(lado * 5.4, 1.75, z + 5.5);
        g.add(tronco, copa);
      }
    }
  }
  return fundirPorCor(g);
}

export class Cena {
  renderer: THREE.WebGLRenderer;
  cena = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(62, 1, 0.1, 220);
  private crianca = criarCrianca();
  private cachorro = criarCachorro();
  private trechos: THREE.Group[] = [];
  private obstaculos = new Map<number, THREE.Group>();
  private moedas = new Map<number, THREE.Mesh>();
  private alvoCamera = new THREE.Vector3();
  private balanco = 0;
  private emPe = false;   // tela em pé: câmera mais alta olhando mais para baixo (menos céu)

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.cena.background = new THREE.Color(COR.ceu);
    this.cena.fog = new THREE.Fog(COR.ceu, 55, 120);
    this.cena.add(new THREE.HemisphereLight(0xffffff, 0x7cc35a, 1.1));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(-6, 12, -4); this.cena.add(sol);
    this.cena.add(this.crianca.g, this.cachorro.g);
    for (let i = 0; i < TRECHOS; i++) { const t = criarTrecho(i); t.position.z = (i - 1) * TRECHO; this.trechos.push(t); this.cena.add(t); }
  }

  redimensionar(l: number, a: number) {
    this.renderer.setSize(l, a, false);
    this.camera.aspect = l / a;
    this.emPe = l < a;
    this.camera.fov = this.emPe ? 70 : 62;
    this.camera.updateProjectionMatrix();
  }

  /** Sincroniza a cena com o estado da corrida e desenha. */
  desenhar(c: Corrida, dt: number) {
    const j = c.jogador;
    const correndo = c.estado === 'correndo';
    // cenário reciclado: trechos que ficaram para trás vão para a frente
    const base = Math.floor((c.z - 12) / TRECHO);
    this.trechos.forEach((t, i) => {
      const k = base + ((i - (base % TRECHOS)) + TRECHOS) % TRECHOS;   // menor índice ≥ base com k ≡ i (mod TRECHOS)
      t.position.z = k * TRECHO;
    });

    // criança: corre balançando braços e pernas; pulo e abaixar mudam a pose
    this.balanco += correndo ? dt * c.vel * 1.1 : dt * 2;
    const k = Math.sin(this.balanco);
    const { g, pernaE, pernaD, bracoE, bracoD } = this.crianca;
    g.position.set(j.x, j.y, c.z);
    const abaixado = c.abaixado;
    g.scale.y += ((abaixado ? 0.5 : 1) - g.scale.y) * Math.min(1, dt * 18);
    const pernas = j.noChao ? k * 0.7 : 0.5;
    pernaE.rotation.x = pernas; pernaD.rotation.x = -pernas;
    bracoE.rotation.x = j.noChao ? -k * 0.8 : -2.4; bracoD.rotation.x = j.noChao ? k * 0.8 : -2.4;
    g.rotation.z = (j.x - FAIXAS[j.faixa]) * -0.12;
    const pisca = c.tempo < c.invencivelAte && Math.floor(c.tempo * 10) % 2 === 0;
    g.visible = !pisca;
    if (c.estado === 'caiu') g.rotation.x = Math.min(g.rotation.x + dt * 6, 1.3); else g.rotation.x = 0;

    // Jack Russell vem atrás, um pouco ao lado, pulando junto
    const cg = this.cachorro.g;
    cg.position.x += (j.x + 0.9 - cg.position.x) * Math.min(1, dt * 6);
    cg.position.z = c.z - 1.7;
    cg.position.y = correndo ? Math.abs(Math.sin(this.balanco * 1.3)) * 0.18 + Math.max(0, j.y - 0.4) * 0.6 : 0;
    this.cachorro.rabo.rotation.z = Math.sin(this.balanco * 3) * 0.6;
    this.cachorro.patas.forEach((p, i) => { p.rotation.x = correndo ? Math.sin(this.balanco * 1.3 + (i % 2 ? Math.PI : 0)) * 0.7 : 0; });

    // obstáculos e moedas: cria quem entrou, tira quem saiu
    const vivos = new Set<number>();
    for (const o of c.obstaculos) {
      vivos.add(o.id);
      if (!this.obstaculos.has(o.id)) { const m = criarObstaculo(o.tipo); m.position.set(FAIXAS[o.faixa], 0, o.z); this.cena.add(m); this.obstaculos.set(o.id, m); }
    }
    for (const [id, m] of this.obstaculos) if (!vivos.has(id)) { this.cena.remove(m); m.traverse((n) => (n as THREE.Mesh).geometry?.dispose()); this.obstaculos.delete(id); }
    vivos.clear();
    for (const m of c.moedasMundo) {
      if (m.pega) continue;
      vivos.add(m.id);
      let malha = this.moedas.get(m.id);
      if (!malha) { malha = new THREE.Mesh(geoMoeda, matMoeda); malha.rotation.z = Math.PI / 2; malha.position.set(FAIXAS[m.faixa], m.y, m.z); this.cena.add(malha); this.moedas.set(m.id, malha); }
      malha.rotation.y += dt * 4;
    }
    for (const [id, m] of this.moedas) if (!vivos.has(id)) { this.cena.remove(m); this.moedas.delete(id); }

    // câmera atrás e acima, acompanhando a faixa com suavidade
    const cam = this.camera;
    const altura = this.emPe ? 5.4 : 3.6, recuo = this.emPe ? 7.6 : 6.8, mira = this.emPe ? 4 : 7;
    const destino = new THREE.Vector3(j.x * 0.55, altura + j.y * 0.35, c.z - recuo);
    cam.position.lerp(destino, Math.min(1, dt * 8));
    this.alvoCamera.set(j.x * 0.7, 1.3 + j.y * 0.3, c.z + mira);
    cam.lookAt(this.alvoCamera);
    this.renderer.render(this.cena, cam);
  }

  info() { return { ...this.renderer.info.render, obstaculos: this.obstaculos.size, moedas: this.moedas.size }; }
}

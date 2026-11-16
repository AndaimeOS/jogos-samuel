// Samuel Surfers — modelos 3D de PROPOSTA (low-poly, flat shading), estilo de luz/material do MetroDash
// (Hemisphere + Directional, Lambert/Standard, ACES). Tudo original. Paleta = estilo-v2.
import * as THREE from 'three';
export const PAL = {
  tinta:0x193337, papel:0xF5F2E8, branco:0xFFFDF7, papel_sombra:0xDCD6C6, verde:0xB9ED80, verde_medio:0x8FD46A, verde_sombra:0x5DAE58,
  laranja:0xFF9D52, laranja_luz:0xFFC890, laranja_sombra:0xE07440, lilas:0xCEB7EF, lilas_sombra:0xA68ED8, lilas_fundo:0x7D68B8,
  amarelo:0xF2D15A, amarelo_luz:0xFFF0A6, amarelo_sombra:0xD9A63E, petroleo:0x1F6F78, petroleo_luz:0x2E959B, ceu:0x9AD8FF,
  rosa:0xFF8A8A, rosa_luz:0xFFC2C2, pele:0xF8CDAE, pele_sombra:0xE4A586, cabelo:0x53352A, cabelo_luz:0x7A5038,
  cinza:0x8D9397, cinza_luz:0xB4B9BC, cinza_claro:0xC8CDCF, tenis:0x3C454B, marrom:0x8A5E3E, marrom_luz:0xB8875A,
  pedra:0xB6BDB4, pedra_sombra:0x87938F, ferro:0x91A3AE, ferro_luz:0xC9D6DE,
};
const mats = {};
export function M(cor, opts = {}) {
  const k = cor + JSON.stringify(opts);
  if (!mats[k]) mats[k] = opts.std ? new THREE.MeshStandardMaterial({ color: PAL[cor] ?? cor, flatShading: true, roughness: opts.r ?? 0.5, metalness: opts.m ?? 0, emissive: opts.e ? (PAL[opts.e] ?? opts.e) : 0x000000, emissiveIntensity: opts.ei ?? 0.3 })
                                   : new THREE.MeshLambertMaterial({ color: PAL[cor] ?? cor, flatShading: true });
  mats[k].name = cor;
  return mats[k];
}
const box = (w, h, d, c, o) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o));
const cyl = (rt, rb, h, s, c, o) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), M(c, o));
const ico = (r, det, c, o) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), M(c, o));
function at(m, x, y, z, rx = 0, ry = 0, rz = 0) { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; }
function nome(o, n) { o.name = n; return o; }

// ---------------- SAMUEL (≈1.6 u de altura; câmera atrás = olha para +z, vemos as costas)
// pivots: quadril, ombros e joelhos para posar. Cabelo = cachos castanhos (icosaedros).
export function samuel(pose = 'parado', f = 0) {
  const g = nome(new THREE.Group(), 'samuel');
  const corpo = nome(new THREE.Group(), 'corpo'); g.add(corpo);
  // tronco (camiseta cinza) e short
  const tronco = at(box(0.62, 0.62, 0.36, 'cinza'), 0, 1.05, 0); corpo.add(tronco);
  corpo.add(at(box(0.66, 0.1, 0.4, 'cinza_luz'), 0, 1.38, 0));            // gola/ombros
  corpo.add(at(box(0.6, 0.3, 0.38, 'cinza_claro'), 0, 0.66, 0));          // short
  // cabeça + cachos
  const cab = nome(new THREE.Group(), 'cabeca'); at(cab, 0, 1.68, 0, 0, Math.PI, 0); corpo.add(cab); // cachos voltados para a câmera (costas)
  cab.add(at(box(0.5, 0.48, 0.46, 'pele'), 0, 0, 0));
  for (const s of [-1, 1]) cab.add(at(box(0.08, 0.14, 0.1, 'pele_sombra'), s * 0.28, -0.02, -0.02)); // orelhas
  const cachos = [[0,0.27,0.05,0.2],[-0.17,0.24,0.08,0.16],[0.17,0.24,0.08,0.16],[-0.24,0.1,0.12,0.15],[0.24,0.1,0.12,0.15],
    [0,0.2,0.22,0.18],[-0.13,0.1,0.25,0.15],[0.13,0.1,0.25,0.15],[0,-0.03,0.26,0.15],[-0.2,-0.05,0.2,0.13],[0.2,-0.05,0.2,0.13],
    [0.08,0.33,-0.08,0.14],[-0.1,0.31,-0.1,0.13],[0,0.22,-0.2,0.12]];
  cachos.forEach(([x, y, z, r], i) => cab.add(at(ico(r, 0, i % 3 ? 'cabelo' : 'cabelo_luz'), x, y, z, i, i * 2, 0)));
  // membros
  const membro = (cor, len, w) => { const p = new THREE.Group(); p.add(at(box(w, len, w, cor), 0, -len / 2, 0)); return p; };
  const braco = s => { const p = new THREE.Group(); p.add(at(box(0.18, 0.18, 0.2, 'cinza'), 0, -0.06, 0)); const a = membro('pele', 0.5, 0.13); at(a, 0, -0.1, 0); p.add(a); p.add(at(box(0.15, 0.13, 0.15, 'pele'), 0, -0.62, 0)); at(p, s * 0.4, 1.32, 0); return p; };
  const perna = s => { const p = new THREE.Group(); p.add(membro('pele', 0.42, 0.15)); const t = new THREE.Group(); t.add(at(box(0.22, 0.14, 0.34, 'tenis'), 0, 0, 0.04)); t.add(at(box(0.23, 0.05, 0.35, 'branco'), 0, -0.08, 0.04)); at(t, 0, -0.46, 0); p.add(t); at(p, s * 0.15, 0.53, 0); return p; };
  const bE = nome(braco(-1), 'bracoE'), bD = nome(braco(1), 'bracoD'), pE = nome(perna(-1), 'pernaE'), pD = nome(perna(1), 'pernaD');
  corpo.add(bE, bD, pE, pD);
  const fase = f * Math.PI / 2;
  if (pose === 'correr') {
    const s = Math.sin(fase);
    pE.rotation.x = s * 0.8; pD.rotation.x = -s * 0.8; bE.rotation.x = -s * 0.9; bD.rotation.x = s * 0.9;
    bE.rotation.z = -0.15; bD.rotation.z = 0.15; corpo.position.y = Math.abs(Math.cos(fase)) * 0.08; tronco.rotation.x = 0.12;
  } else if (pose === 'pular') {
    corpo.position.y = 0.7; pE.rotation.x = -0.9; pD.rotation.x = 0.3; bE.rotation.z = -2.5; bD.rotation.z = 2.5;
  } else if (pose === 'rolar') {
    // bolinha: joelhos no peito, braços abraçando, cabeça baixa; o grupo gira no centro do corpo
    pE.rotation.x = pD.rotation.x = -2.2; bE.rotation.x = bD.rotation.x = -1.2; bE.rotation.z = -0.3; bD.rotation.z = 0.3;
    cab.position.set(0, 1.45, 0.12); corpo.position.y = -0.75;
    const piv = new THREE.Group(); g.remove(corpo); piv.add(corpo); piv.position.y = 0.55; piv.rotation.x = f === 0 ? 0.45 : 1.0; if (f === 1) piv.position.y = 0.45; g.add(piv);
  } else if (pose === 'tropecar') {
    // cai sentado, pernas para a frente, mãos no chão, estrelinhas
    corpo.position.y = -0.5; pE.rotation.x = pD.rotation.x = -1.5; pE.rotation.z = -0.25; pD.rotation.z = 0.25;
    bE.rotation.z = -0.6; bD.rotation.z = 0.6; bE.rotation.x = bD.rotation.x = 0.5; cab.rotation.z = 0.25;
    const est = nome(new THREE.Group(), 'estrelinhas'); at(est, 0, 2.25, 0); g.add(est);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + f; est.add(at(estrela(i % 2 ? 'lilas' : 'amarelo'), Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45)); }
  } else { bE.rotation.z = -0.08; bD.rotation.z = 0.08; }
  return g;
}
export function estrela(cor) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 0.05 : 0.13, a = i * Math.PI / 4; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(r, 0); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), M(cor, { std: true, e: cor, ei: 0.5 }));
}
// ---------------- DOGUINHO (branco/creme, orelhas caramelo-marrom, coleira petróleo com plaquinha amarela)
export function doguinho(pose = 'correr', f = 0) {
  const g = nome(new THREE.Group(), 'doguinho'); const c = nome(new THREE.Group(), 'corpo'); g.add(c);
  c.add(at(box(0.42, 0.36, 0.7, 'papel'), 0, 0.42, 0));
  const cab = new THREE.Group(); at(cab, 0, 0.72, 0.32); c.add(cab);
  cab.add(at(box(0.4, 0.36, 0.36, 'branco'), 0, 0, 0)); cab.add(at(box(0.2, 0.16, 0.18, 'papel'), 0, -0.07, 0.24));
  cab.add(at(box(0.07, 0.06, 0.05, 'tinta'), 0, -0.02, 0.34));
  for (const s of [-1, 1]) cab.add(at(box(0.1, 0.26, 0.16, 'marrom_luz'), s * 0.24, -0.02, -0.02, 0, 0, s * 0.25));
  c.add(at(box(0.44, 0.07, 0.1, 'petroleo'), 0, 0.58, 0.28)); c.add(at(box(0.07, 0.07, 0.03, 'amarelo', { std: true, m: 0.4 }), 0, 0.53, 0.34));
  const rabo = nome(new THREE.Group(), 'rabo'); rabo.add(at(box(0.08, 0.28, 0.08, 'papel'), 0, 0.14, 0)); rabo.add(at(box(0.11, 0.1, 0.11, 'marrom_luz'), 0, 0.3, 0)); at(rabo, 0, 0.55, -0.35); c.add(rabo);
  const s = Math.sin(f * Math.PI / 2); rabo.rotation.z = s * 0.5; rabo.rotation.x = -0.5;
  [[-0.13, 0.25], [0.13, 0.25], [-0.13, -0.25], [0.13, -0.25]].forEach(([x, z], i) => {
    const p = nome(new THREE.Group(), 'pata'+i); p.add(at(box(0.11, 0.26, 0.11, 'papel_sombra'), 0, -0.13, 0)); at(p, x, 0.28, z);
    if (pose === 'correr') p.rotation.x = (i % 3 === 0 ? 1 : -1) * s * 0.7;
    if (pose === 'pular') p.rotation.x = z > 0 ? -0.8 : 0.8;
    if (pose === 'tropecar') { p.rotation.z = x > 0 ? 1.2 : -1.2; }
    c.add(p);
  });
  if (pose === 'correr') c.position.y = Math.abs(Math.cos(f * Math.PI / 2)) * 0.06;
  if (pose === 'pular') c.position.y = 0.45;
  if (pose === 'tropecar') { c.position.y = -0.12; cab.rotation.z = 0.3; const est = new THREE.Group(); at(est, 0, 1.05, 0.3); g.add(est); for (let i = 0; i < 3; i++) est.add(at(estrela('amarelo'), Math.cos(i * 2.1) * 0.28, 0, Math.sin(i * 2.1) * 0.28)); }
  return g;
}
// ---------------- obstáculos (largura de trilho = 3.1 u, como o MetroDash)
export function barreiraPular() {
  const g = nome(new THREE.Group(), 'barreira_pular');
  const tabua = new THREE.Group(); at(tabua, 0, 0.85, 0); g.add(tabua);
  tabua.add(box(2.6, 0.5, 0.2, 'papel'));
  for (let i = 0; i < 5; i++) tabua.add(at(box(0.3, 0.52, 0.22, 'verde_medio'), -1.05 + i * 0.52, 0, 0, 0, 0, 0.5));
  for (const s of [-1, 1]) { g.add(at(box(0.14, 0.9, 0.14, 'ferro', { std: true, m: 0.5, r: 0.35 }), s * 1.0, 0.45, 0)); g.add(at(box(0.5, 0.08, 0.5, 'ferro'), s * 1.0, 0.04, 0)); }
  g.add(at(cyl(0.12, 0.12, 0.1, 12, 'amarelo', { std: true, e: 'amarelo', ei: 0.8 }), 0, 1.16, 0, Math.PI / 2));
  return g;
}
export function arcoRolar() {
  const g = nome(new THREE.Group(), 'arco_rolar');
  for (const s of [-1, 1]) g.add(at(box(0.22, 2.6, 0.22, 'ferro', { std: true, m: 0.5, r: 0.35 }), s * 1.3, 1.3, 0));
  const faixa = new THREE.Group(); at(faixa, 0, 2.3, 0); g.add(faixa);
  faixa.add(box(2.9, 0.6, 0.25, 'lilas'));
  for (let i = 0; i < 6; i++) faixa.add(at(box(0.25, 0.62, 0.27, 'papel'), -1.2 + i * 0.48, 0, 0, 0, 0, 0.5));
  const seta = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 3), M('amarelo', { std: true, e: 'amarelo', ei: 0.4 })); at(seta, 0, 1.75, 0, Math.PI, 0, 0); g.add(seta);
  return g;
}
export function cone() {
  const g = nome(new THREE.Group(), 'cone');
  g.add(at(box(0.7, 0.08, 0.7, 'laranja_sombra'), 0, 0.04, 0));
  g.add(at(cyl(0.05, 0.3, 0.85, 10, 'laranja'), 0, 0.5, 0));
  g.add(at(cyl(0.17, 0.21, 0.14, 10, 'branco'), 0, 0.5, 0));
  return g;
}
export function bondinho() {
  // bondinho de bairro: arredondado, creme com faixa lilás, carinha sorridente na traseira (faróis = olhos)
  const g = nome(new THREE.Group(), 'bondinho');
  const corpo = at(box(2.7, 2.6, 6, 'papel', { std: true, r: 0.45 }), 0, 1.75, 0); g.add(corpo);
  g.add(at(box(2.75, 0.5, 6.05, 'lilas'), 0, 1.25, 0));
  g.add(at(box(2.5, 0.18, 5.8, 'lilas_sombra'), 0, 3.12, 0));      // teto plano (dá pra subir)
  g.add(at(box(2.85, 0.35, 6.1, 'tenis'), 0, 0.35, 0));
  for (const z of [-2, 2]) for (const s of [-1, 1]) g.add(at(cyl(0.38, 0.38, 0.25, 12, 'ferro', { std: true, m: 0.5 }), s * 1.25, 0.38, z, 0, 0, Math.PI / 2));
  const tz = -3.02; // traseira (virada para a câmera)
  g.add(at(box(1.9, 0.9, 0.06, 'ceu', { std: true, e: 'ceu', ei: 0.25, r: 0.2 }), 0, 2.3, tz));
  g.add(at(box(0.06, 0.9, 0.08, 'tinta'), 0, 2.3, tz - 0.01));
  for (const s of [-1, 1]) g.add(at(cyl(0.2, 0.2, 0.08, 14, 'amarelo', { std: true, e: 'amarelo', ei: 0.7 }), s * 0.85, 1.25, tz - 0.03, Math.PI / 2));
  const sorriso = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 14, Math.PI), M('tinta')); at(sorriso, 0, 0.95, tz - 0.04, 0, 0, Math.PI); g.add(sorriso);
  for (const s of [-1, 1]) g.add(at(cyl(0.1, 0.1, 0.04, 10, 'rosa_luz'), s * 0.55, 0.92, tz - 0.03, Math.PI / 2));
  return g;
}
export function rampa() {
  const g = nome(new THREE.Group(), 'rampa');
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(4, 0); sh.lineTo(4, 1.6); sh.lineTo(0, 0.05); sh.lineTo(0, 0);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: false }), M('amarelo'));
  at(m, 1.3, 0, -2, 0, -Math.PI / 2, 0); g.add(m);
  for (let i = 0; i < 4; i++) g.add(at(box(2.62, 0.05, 0.12, 'amarelo_sombra'), 0, 0.25 + i * 0.37, -1.4 + i * 0.93, -0.38, 0, 0));
  return g;
}
// ---------------- coletáveis
export function moeda() {
  // moeda-folhinha: disco dourado com folhinha em relevo (sem fenda), estilo Standard emissivo como o MetroDash
  const g = nome(new THREE.Group(), 'moeda');
  g.add(at(cyl(0.42, 0.42, 0.13, 18, 'amarelo', { std: true, m: 0.45, r: 0.25, e: 'amarelo_sombra', ei: 0.3 }), 0, 0, 0, Math.PI / 2));
  g.add(at(cyl(0.32, 0.32, 0.145, 18, 'amarelo_sombra', { std: true, m: 0.3 }), 0, 0, 0, Math.PI / 2));
  const folha = new THREE.Shape(); folha.moveTo(0, -0.2); folha.quadraticCurveTo(0.2, 0, 0, 0.22); folha.quadraticCurveTo(-0.2, 0, 0, -0.2);
  for (const z of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.ExtrudeGeometry(folha, { depth: 0.03, bevelEnabled: false }), M('amarelo_luz', { std: true, e: 'amarelo_luz', ei: 0.4 })), 0, 0, z * 0.075, 0, z < 0 ? Math.PI : 0, 0.4));
  return g;
}
export function prancha() {
  const g = nome(new THREE.Group(), 'prancha');
  const sh = new THREE.Shape(); sh.moveTo(0, -1); sh.quadraticCurveTo(0.55, -0.2, 0.05, 1); sh.quadraticCurveTo(-0.55, -0.2, 0, -1);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), M('verde_medio', { std: true, r: 0.4 }));
  at(tab, 0, 0.25, 0, -Math.PI / 2, 0, 0); g.add(tab);
  g.add(at(box(0.04, 0.02, 1.7, 'papel'), 0, 0.37, 0));                                // nervura
  for (const z of [-0.45, 0, 0.45]) g.add(at(box(0.4, 0.02, 0.03, 'papel'), 0, 0.37, z + 0.1, 0, z < 0 ? -0.5 : 0.5, 0));
  for (const z of [-0.6, 0.6]) for (const s of [-1, 1]) g.add(at(cyl(0.08, 0.08, 0.08, 10, 'laranja'), s * 0.18, 0.12, z, 0, 0, Math.PI / 2));
  return g;
}
export function ima() {
  const g = nome(new THREE.Group(), 'ima');
  const u = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.13, 8, 16, Math.PI), M('rosa', { std: true, r: 0.35 })); at(u, 0, 0.1, 0); g.add(u);
  for (const s of [-1, 1]) { g.add(at(cyl(0.13, 0.13, 0.3, 8, 'rosa', { std: true }), s * 0.35, -0.05, 0)); g.add(at(cyl(0.135, 0.135, 0.15, 8, 'papel'), s * 0.35, -0.27, 0)); }
  for (let i = 0; i < 3; i++) g.add(at(estrela('amarelo'), -0.45 + i * 0.45, 0.65 + (i % 2) * 0.12, 0));
  return g;
}
// ---------------- cidade (segmento de 10 u, como o MetroDash: 3 trilhos, dormentes, muro, prédios)
export function segmento(z0 = 0, seed = 1) {
  const g = nome(new THREE.Group(), 'segmento'); let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  g.add(at(box(14, 0.25, 10, 'pedra_sombra'), 0, -0.15, 0));
  for (const lane of [-1, 0, 1]) {
    for (const s of [-0.72, 0.72]) g.add(at(box(0.12, 0.12, 10, 'ferro_luz', { std: true, m: 0.8, r: 0.25 }), lane * 3.1 + s, 0.08, 0));
    for (let z = -4.5; z <= 4.5; z += 1.05) g.add(at(box(2.45, 0.13, 0.28, 'marrom'), lane * 3.1, -0.02, z));
  }
  for (const s of [-1, 1]) {
    g.add(at(box(0.7, 1.25, 10, 'laranja_luz'), s * 7.25, 0.5, 0));
    g.add(at(box(0.72, 0.3, 10.02, 'verde_medio'), s * 7.25, 0.55, 0));
    g.add(at(box(0.9, 0.12, 10, 'laranja_sombra'), s * 7.25, 1.15, 0));
    g.add(at(box(5, 0.3, 10, 'pedra'), s * 10, 0.4, 0));                                   // calçada
    // poste com luz amarela + árvore redonda
    const poste = new THREE.Group(); poste.add(at(cyl(0.08, 0.1, 3.4, 6, 'petroleo'), 0, 1.7, 0)); poste.add(at(ico(0.25, 0, 'amarelo_luz', { std: true, e: 'amarelo', ei: 0.8 }), 0, 3.5, 0)); at(poste, s * 8.4, 0.5, -2); g.add(poste);
    const arv = new THREE.Group(); arv.add(at(cyl(0.15, 0.2, 1.2, 6, 'marrom'), 0, 0.6, 0)); arv.add(at(ico(1.0, 0, 'verde_medio'), 0, 1.8, 0)); arv.add(at(ico(0.6, 0, 'verde'), 0.3, 2.3, -0.2)); at(arv, s * 10.5, 0.5, 2.5); g.add(arv);
  }
  at(g, 0, 0, z0); return g;
}
export function predio(cor, w, h, d) {
  const g = nome(new THREE.Group(), 'predio');
  g.add(at(box(w, h, d, cor), 0, h / 2, 0));
  g.add(at(box(w + 0.3, 0.3, d + 0.3, 'papel'), 0, h + 0.15, 0));
  for (let y = 1.6; y < h - 0.8; y += 2.2) for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 1.6) {
    g.add(at(box(0.9, 1.1, 0.06, 'ceu', { std: true, e: 'ceu', ei: 0.3, r: 0.2 }), x, y, -d / 2 - 0.03));
    g.add(at(box(1.1, 0.18, 0.4, 'laranja'), x, y + 0.7, -d / 2 - 0.15));               // toldinho
  }
  return g;
}
export function cidade(nseg = 9, seed = 3) {
  const g = nome(new THREE.Group(), 'cidade'); let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < nseg; i++) g.add(segmento(i * 10 - 10, i + 1));
  const cores = ['lilas', 'verde', 'amarelo', 'rosa_luz', 'laranja_luz', 'ceu'];
  for (let i = 0; i < 34; i++) for (const s of [-1, 1]) {
    const w = 4 + rnd() * 4, h = 5 + rnd() * 11, d = 4 + rnd() * 3;
    const p = predio(cores[(i * 2 + (s > 0 ? 1 : 0)) % cores.length], w, h, d); at(p, s * (19 + rnd() * 8), 0, 8 + i * 5, 0, s * -Math.PI / 2, 0); g.add(p);
  }
  // nuvens fofas
  for (let i = 0; i < 10; i++) { const n = new THREE.Group(); for (let k = 0; k < 4; k++) n.add(at(ico(2 + rnd() * 2, 1, 'branco'), k * 2.6, rnd(), 0)); at(n, -40 + i * 10 + rnd() * 6, 30 + rnd() * 12, 120 + rnd() * 20); g.add(n); }
  return g;
}
export function luzes(scene) {
  scene.fog = new THREE.Fog(0xbfe6ff, 62, 190);
  scene.add(new THREE.HemisphereLight(0xe6f6ff, 0x4a5a6e, 2.2));
  const sun = new THREE.DirectionalLight(0xfff1cc, 3.0); sun.position.set(-8, 18, -3); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(6, 6, -12); scene.add(fill);
}

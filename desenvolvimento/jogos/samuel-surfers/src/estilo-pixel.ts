import * as THREE from 'three';
import { CONFIG } from './config';
import { PIXEL, PX_POR_UNIDADE } from './contrato-arte';
import { montarCenario } from './estilo-blocos';
import { carregarTextura } from './textura';
import type { TipoEntidade } from './tipos';
import type { Visual } from './visual';

const px = (n: number) => n / PX_POR_UNIDADE;

function quadro(nome: string, lista: readonly string[]): number {
  const i = lista.indexOf(nome);
  return i < 0 ? 0 : i;
}

function andar(tempo: number, lista: readonly string[], prefixo: string): number {
  const quais = lista.filter((nome) => nome.startsWith(prefixo));
  const i = Math.floor(tempo * PIXEL.fps) % quais.length;
  return quadro(quais[i], lista);
}

export async function montarPixel(): Promise<Visual> {
  const arquivos: string[] = [];
  const texturas: THREE.Texture[] = [];
  const materiais: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];

  const pedir = async (url: string, repetir?: { u: number; v: number }) => {
    arquivos.push(url);
    const tex = await carregarTextura(url, repetir);
    texturas.push(tex);
    return tex;
  };

  const samuelTex = await pedir(PIXEL.samuel.arquivo);
  samuelTex.repeat.set(1 / PIXEL.samuel.quadros.length, 1);
  const dogTex = await pedir(PIXEL.doguinho.arquivo);
  dogTex.repeat.set(1 / PIXEL.doguinho.quadros.length, 1);

  const sprite = (tex: THREE.Texture, w: number, h: number) => {
    const mat = new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5, transparent: false });
    materiais.push(mat);
    const s = new THREE.Sprite(mat);
    s.frustumCulled = false;
    s.center.set(0.5, 0);
    s.scale.set(w, h, 1);
    return s;
  };

  const samuel = sprite(samuelTex, CONFIG.samuelLargura, CONFIG.samuelAltura);
  samuel.name = 'samuel';
  const dog = sprite(dogTex, CONFIG.dogTamanho, CONFIG.dogTamanho);
  dog.name = 'doguinho';
  const pranchaTex = await pedir(PIXEL.coletaveis.prancha);
  pranchaTex.repeat.set(0.5, 1);
  const prancha = sprite(pranchaTex, px(32), px(16));
  prancha.name = 'prancha-pe';
  samuel.add(prancha);

  const moedaTex = await pedir(PIXEL.coletaveis.moeda);
  moedaTex.repeat.set(0.25, 1);
  const imaTex = await pedir(PIXEL.coletaveis.ima);
  imaTex.repeat.set(0.5, 1);

  const caixa = async (url: string, wPx: number, hPx: number, d: number, dz: number) => {
    const map = await pedir(url);
    const geo = new THREE.BoxGeometry(px(wPx), px(hPx), d);
    geos.push(geo);
    const mat = new THREE.MeshLambertMaterial({ map, alphaTest: 0.5 });
    materiais.push(mat);
    return () => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.y = px(hPx) / 2;
      mesh.userData.dz = dz;
      return mesh;
    };
  };

  const fabricas = {
    barreira: await caixa(PIXEL.obstaculos.barreira, 48, 24, 0.35, 0),
    placa: await caixa(PIXEL.obstaculos.placa, 48, 48, 0.28, 0),
    cone: await caixa(PIXEL.obstaculos.cone, 16, 20, px(16), 0),
    vagao: await caixa(PIXEL.obstaculos.vagao, 64, 72, CONFIG.vagaoComprimento, CONFIG.vagaoComprimento / 2),
  };

  const geoMoeda = new THREE.PlaneGeometry(px(16), px(16));
  const geoIma = new THREE.PlaneGeometry(px(20), px(20));
  const geoPrancha = new THREE.PlaneGeometry(px(32), px(16));
  geos.push(geoMoeda, geoIma, geoPrancha);
  const matMoeda = new THREE.MeshLambertMaterial({ map: moedaTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const matIma = new THREE.MeshLambertMaterial({ map: imaTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const matPrancha = new THREE.MeshLambertMaterial({ map: pranchaTex, alphaTest: 0.5, side: THREE.DoubleSide });
  materiais.push(matMoeda, matIma, matPrancha);

  const plano = (geo: THREE.PlaneGeometry, mat: THREE.Material, y: number) => () => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.y = y;
    mesh.userData.dz = 0;
    return mesh;
  };

  const fixos = new THREE.Group();

  return {
    arquivos,
    atualizar(foto, tempo) {
      if (samuel.parent && fixos.parent !== samuel.parent) samuel.parent.add(fixos);
      const quadros = PIXEL.samuel.quadros;
      let pose = 'parado';
      let indice = quadro('parado_0', quadros);
      if (foto?.tropecando) {
        pose = 'tropecar';
        indice = quadro('tropecar_0', quadros);
      } else if (foto?.rolando) {
        pose = 'rolar';
        indice = andar(tempo, quadros, 'rolar');
      } else if (foto?.pulando) {
        pose = 'pular';
        indice = quadro('pular_0', quadros);
      } else if (foto) {
        pose = 'correr';
        indice = andar(tempo, quadros, 'correr');
      }
      samuelTex.offset.x = indice / quadros.length;

      const dogQuadros = PIXEL.doguinho.quadros;
      let dogI = quadro('correr_0', dogQuadros);
      if (foto?.tropecando) dogI = quadro('tropecar_0', dogQuadros);
      else if (foto?.pulando) dogI = quadro('pular_0', dogQuadros);
      else dogI = andar(tempo, dogQuadros, 'correr');
      dogTex.offset.x = dogI / dogQuadros.length;
      moedaTex.offset.x = (Math.floor(tempo * PIXEL.fps) % 4) / 4;
      pranchaTex.offset.x = (Math.floor(tempo * 6) % 2) / 2;
      imaTex.offset.x = (Math.floor(tempo * 6) % 2) / 2;

      const x = (foto?.x ?? 0) * CONFIG.faixa;
      const y = foto?.y ?? 0;
      samuel.position.set(foto?.tropecando ? x + Math.sin(tempo * 28) * 0.06 : x, y, 0);
      samuel.scale.set(CONFIG.samuelLargura, foto?.rolando ? CONFIG.samuelAltura * 0.62 : CONFIG.samuelAltura, 1);
      (samuel.material as THREE.SpriteMaterial).color.set(foto?.protegido ? 0xdfffc4 : 0xffffff);
      dog.position.set(x + CONFIG.dogOffsetX, y * 0.2, CONFIG.dogOffsetZ);
      prancha.visible = (foto?.prancha ?? 0) > 0;
      prancha.position.set(0, 0.05, 0.15);
      return pose;
    },
    criar(tipo: TipoEntidade) {
      if (tipo === 'moeda') return plano(geoMoeda, matMoeda, 0.85)();
      if (tipo === 'ima') return plano(geoIma, matIma, 1.05)();
      if (tipo === 'prancha') return plano(geoPrancha, matPrancha, 0.7)();
      return fabricas[tipo]();
    },
    samuel,
    dog,
    async montarPista(grupo, comprimento, ceu) {
      montarCenario(grupo, comprimento, ceu, fixos);
    },
    descartar() {
      samuel.removeFromParent();
      dog.removeFromParent();
      fixos.removeFromParent();
      texturas.forEach((tex) => tex.dispose());
      materiais.forEach((mat) => mat.dispose());
      geos.forEach((geo) => geo.dispose());
    },
  };
}

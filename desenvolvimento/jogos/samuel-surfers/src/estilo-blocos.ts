import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from './config';
import {
  arcoRolar, barreiraPular, bondinho, cone, doguinho, ima, moeda, predio, prancha, samuel, segmento,
} from './modelos.js';
import type { Foto, TipoEntidade } from './tipos';
import type { Visual } from './visual';

const CORES_PREDIO = ['lilas', 'verde', 'amarelo', 'rosa_luz'] as const;

function semIndice(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo.clone();
}

function fundir(raiz: THREE.Object3D): THREE.Group {
  raiz.updateMatrixWorld(true);
  const por = new Map<THREE.Material, THREE.BufferGeometry[]>();
  raiz.traverse((obj) => {
    const malha = obj as THREE.Mesh;
    if (!malha.isMesh) return;
    const geo = semIndice(malha.geometry);
    geo.applyMatrix4(malha.matrixWorld);
    const lista = por.get(malha.material as THREE.Material) ?? [];
    lista.push(geo);
    por.set(malha.material as THREE.Material, lista);
  });
  const grupo = new THREE.Group();
  for (const [material, geos] of por) {
    const unido = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!unido) continue;
    if (geos.length > 1) geos.forEach((geo) => geo.dispose());
    grupo.add(new THREE.Mesh(unido, material));
  }
  return grupo;
}

function compactar(obj: THREE.Object3D): void {
  const malhas = obj.children.filter((filho) => (filho as THREE.Mesh).isMesh) as THREE.Mesh[];
  if (malhas.length > 1) {
    const por = new Map<THREE.Material, THREE.BufferGeometry[]>();
    for (const malha of malhas) {
      malha.updateMatrix();
      const geo = semIndice(malha.geometry);
      geo.applyMatrix4(malha.matrix);
      const lista = por.get(malha.material as THREE.Material) ?? [];
      lista.push(geo);
      por.set(malha.material as THREE.Material, lista);
    }
    const novos: THREE.Mesh[] = [];
    let ok = true;
    for (const [material, geos] of por) {
      const unido = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!unido) {
        ok = false;
        geos.forEach((geo) => geo.dispose());
        break;
      }
      if (geos.length > 1) geos.forEach((geo) => geo.dispose());
      novos.push(new THREE.Mesh(unido, material));
    }
    if (ok) {
      malhas.forEach((malha) => malha.removeFromParent());
      novos.forEach((malha) => obj.add(malha));
    } else {
      novos.forEach((malha) => malha.geometry.dispose());
    }
  }
  for (const filho of [...obj.children]) {
    if (!(filho as THREE.Mesh).isMesh) compactar(filho);
  }
}

function sombra(): THREE.Mesh {
  const malha = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 14),
    new THREE.MeshBasicMaterial({ color: 0x193337, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  malha.rotation.x = -Math.PI / 2;
  malha.position.y = 0.04;
  malha.name = 'sombra';
  return malha;
}

function poseSamuel(grupo: THREE.Object3D, pose: string, tempo: number): void {
  const corpo = grupo.getObjectByName('corpo');
  const cabeca = grupo.getObjectByName('cabeca');
  const bracoE = grupo.getObjectByName('bracoE');
  const bracoD = grupo.getObjectByName('bracoD');
  const pernaE = grupo.getObjectByName('pernaE');
  const pernaD = grupo.getObjectByName('pernaD');
  if (!corpo || !cabeca || !bracoE || !bracoD || !pernaE || !pernaD) return;
  corpo.position.y = 0;
  corpo.rotation.set(0, 0, 0);
  cabeca.position.set(0, 1.68, 0);
  cabeca.rotation.set(0, Math.PI, 0);
  bracoE.rotation.set(0, 0, -0.08);
  bracoD.rotation.set(0, 0, 0.08);
  pernaE.rotation.set(0, 0, 0);
  pernaD.rotation.set(0, 0, 0);
  const s = Math.sin(tempo * 12);
  if (pose === 'correr') {
    pernaE.rotation.x = s * 0.8;
    pernaD.rotation.x = -s * 0.8;
    bracoE.rotation.x = -s * 0.9;
    bracoD.rotation.x = s * 0.9;
    bracoE.rotation.z = -0.15;
    bracoD.rotation.z = 0.15;
    corpo.position.y = Math.abs(Math.cos(tempo * 12)) * 0.08;
  } else if (pose === 'pular') {
    pernaE.rotation.x = -0.9;
    pernaD.rotation.x = 0.3;
    bracoE.rotation.z = -2.5;
    bracoD.rotation.z = 2.5;
  } else if (pose === 'rolar') {
    pernaE.rotation.x = -2.2;
    pernaD.rotation.x = -2.2;
    bracoE.rotation.x = -1.2;
    bracoD.rotation.x = -1.2;
    cabeca.position.set(0, 1.45, 0.12);
    corpo.position.y = -0.35;
  } else if (pose === 'tropecar') {
    corpo.position.y = -0.45;
    pernaE.rotation.x = -1.5;
    pernaD.rotation.x = -1.5;
    pernaE.rotation.z = -0.25;
    pernaD.rotation.z = 0.25;
    bracoE.rotation.z = -0.6;
    bracoD.rotation.z = 0.6;
    bracoE.rotation.x = 0.5;
    bracoD.rotation.x = 0.5;
    cabeca.rotation.z = 0.25;
  }
}

function poseDog(grupo: THREE.Object3D, pose: string, tempo: number): void {
  const corpo = grupo.getObjectByName('corpo');
  const rabo = grupo.getObjectByName('rabo');
  if (!corpo || !rabo) return;
  corpo.position.y = 0;
  corpo.rotation.set(0, 0, 0);
  const s = Math.sin(tempo * 12);
  rabo.rotation.set(-0.5, 0, s * 0.5);
  for (let i = 0; i < 4; i++) {
    const pata = grupo.getObjectByName('pata' + i);
    if (!pata) continue;
    pata.rotation.set(0, 0, 0);
    if (pose === 'correr') pata.rotation.x = (i % 2 === 0 ? 1 : -1) * s * 0.7;
    else if (pose === 'pular') pata.rotation.x = i < 2 ? -0.8 : 0.8;
    else if (pose === 'tropecar') pata.rotation.z = i % 2 ? 1.2 : -1.2;
  }
  if (pose === 'correr') corpo.position.y = Math.abs(Math.cos(tempo * 12)) * 0.06;
  if (pose === 'pular') corpo.position.y = 0.45;
  if (pose === 'tropecar') corpo.position.y = -0.12;
}

function poseDe(foto: Foto | null): string {
  if (!foto) return 'parado';
  if (foto.tropecando) return 'tropecar';
  if (foto.rolando) return 'rolar';
  if (foto.pulando) return 'pular';
  return 'correr';
}

function faixaTrilho(n: number, seed: number): THREE.Group {
  const faixa = new THREE.Group();
  const bolsa = new THREE.Group();
  const matrizes: THREE.Matrix4[] = [];
  let geoDormente: THREE.BufferGeometry | null = null;
  let matDormente: THREE.Material | null = null;
  for (let i = 0; i < n; i++) {
    const seg = segmento(i * 10, seed + i) as THREE.Group;
    seg.updateMatrixWorld(true);
    const tirar: THREE.Object3D[] = [];
    seg.traverse((obj) => {
      const malha = obj as THREE.Mesh;
      if (!malha.isMesh) return;
      const params = (malha.geometry as THREE.BoxGeometry).parameters;
      if (params?.width === 2.45 && params.height === 0.13 && params.depth === 0.28) {
        matrizes.push(malha.matrixWorld.clone());
        geoDormente = malha.geometry;
        matDormente = malha.material as THREE.Material;
        tirar.push(malha);
      }
    });
    tirar.forEach((obj) => obj.removeFromParent());
    const casa = predio(CORES_PREDIO[i % CORES_PREDIO.length], 4.2, 5.5 + (i % 3), 3.6) as THREE.Group;
    casa.position.set(i % 2 === 0 ? 13.5 : -13.5, 0, i * 10);
    seg.add(casa);
    bolsa.add(seg);
  }
  faixa.add(fundir(bolsa));
  if (geoDormente && matDormente && matrizes.length) {
    const inst = new THREE.InstancedMesh(geoDormente, matDormente, matrizes.length);
    matrizes.forEach((matriz, i) => inst.setMatrixAt(i, matriz));
    inst.instanceMatrix.needsUpdate = true;
    faixa.add(inst);
  }
  return faixa;
}

export async function montarBlocos(): Promise<Visual> {
  const samuelModelo = samuel('parado', 0) as THREE.Group;
  compactar(samuelModelo);
  samuelModelo.scale.setScalar(CONFIG.escalaSamuel);
  const raizSamuel = new THREE.Group();
  const sombraSamuel = sombra();
  raizSamuel.add(samuelModelo, sombraSamuel);
  const dogModelo = doguinho('parado', 0) as THREE.Group;
  compactar(dogModelo);
  dogModelo.scale.setScalar(CONFIG.escalaDog);
  const raizDog = new THREE.Group();
  const sombraDog = sombra();
  sombraDog.scale.setScalar(0.65);
  raizDog.add(dogModelo, sombraDog);
  const fixos = new THREE.Group();

  const moedaModelo = moeda() as THREE.Group;
  moedaModelo.updateMatrixWorld(true);
  const partesMoeda: THREE.InstancedMesh[] = [];
  const locais: THREE.Matrix4[] = [];
  moedaModelo.traverse((obj) => {
    const malha = obj as THREE.Mesh;
    if (!malha.isMesh) return;
    const inst = new THREE.InstancedMesh(malha.geometry, malha.material, 48);
    inst.count = 0;
    inst.frustumCulled = false;
    partesMoeda.push(inst);
    locais.push(malha.matrixWorld.clone());
  });

  const moldes = new Map<TipoEntidade, THREE.Object3D>();
  const garantir = (tipo: TipoEntidade, construir: () => THREE.Object3D, y: number, dz: number) => {
    if (!moldes.has(tipo)) {
      const molde = fundir(construir());
      molde.userData.y = y;
      molde.userData.dz = dz;
      moldes.set(tipo, molde);
    }
    const copia = moldes.get(tipo)!.clone();
    copia.userData.y = y;
    copia.userData.dz = dz;
    return copia;
  };

  const dummy = new THREE.Object3D();
  const composta = new THREE.Matrix4();
  let moedas: THREE.Object3D[] = [];

  return {
    arquivos: [],
    samuel: raizSamuel,
    dog: raizDog,
    atualizar(foto, tempo) {
      if (raizSamuel.parent && fixos.parent !== raizSamuel.parent) {
        raizSamuel.parent.add(fixos);
        fixos.add(...partesMoeda);
      }
      const pose = poseDe(foto);
      poseSamuel(samuelModelo, pose, tempo);
      const x = (foto?.x ?? 0) * CONFIG.faixa;
      const y = foto?.y ?? 0;
      raizSamuel.position.set(foto?.tropecando ? x + Math.sin(tempo * 28) * 0.08 : x, y, 0);
      raizDog.position.set(x + CONFIG.dogOffsetX, y * 0.2, CONFIG.dogOffsetZ);
      poseDog(dogModelo, !foto || foto.rolando || pose === 'parado' || pose === 'correr' ? 'correr' : pose, tempo);
      let n = 0;
      for (const marca of moedas) {
        if (!marca.parent) continue;
        dummy.position.copy(marca.position);
        dummy.rotation.set(0, tempo * 3, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        partesMoeda.forEach((inst, i) => {
          composta.multiplyMatrices(dummy.matrix, locais[i]);
          inst.setMatrixAt(n, composta);
        });
        n += 1;
      }
      for (const inst of partesMoeda) {
        inst.count = n;
        inst.instanceMatrix.needsUpdate = true;
        inst.visible = n > 0;
      }
    },
    criar(tipo) {
      if (tipo === 'moeda') {
        const marca = new THREE.Object3D();
        marca.userData.y = 1.05;
        marca.userData.dz = 0;
        moedas.push(marca);
        return marca;
      }
      if (tipo === 'barreira') return garantir(tipo, () => barreiraPular() as THREE.Object3D, 0, 0);
      if (tipo === 'placa') return garantir(tipo, () => arcoRolar() as THREE.Object3D, 0, 0);
      if (tipo === 'cone') return garantir(tipo, () => cone() as THREE.Object3D, 0, 0);
      if (tipo === 'vagao') return garantir(tipo, () => bondinho() as THREE.Object3D, 0, CONFIG.vagaoComprimento / 2);
      if (tipo === 'prancha') return garantir(tipo, () => prancha() as THREE.Object3D, 0.15, 0);
      return garantir(tipo, () => ima() as THREE.Object3D, 0.2, 0);
    },
    async montarPista(grupo, comprimento, ceu) {
      const n = Math.max(1, Math.round(comprimento / 10));
      const faixa = faixaTrilho(n, ceu ? 1 : 9);
      faixa.position.z = 5;
      grupo.add(faixa);
      if (ceu) {
        const sol = new THREE.Mesh(
          new THREE.CircleGeometry(8, 20),
          new THREE.MeshBasicMaterial({ color: 0xfff0a6, fog: false }),
        );
        sol.position.set(-28, 27, 110);
        sol.lookAt(0, 0, 0);
        fixos.add(sol);
      }
    },
    descartar() {
      raizSamuel.removeFromParent();
      raizDog.removeFromParent();
      fixos.removeFromParent();
      moedas = [];
    },
  };
}

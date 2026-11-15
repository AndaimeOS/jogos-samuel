import * as THREE from 'three';
import { CONFIG } from './config';
import type { Estilo } from './contrato-arte';
import { montarPixel } from './estilo-pixel';
import type { Entidade, Faixa, Foto } from './tipos';
import type { Visual } from './visual';

interface Faísca {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  vida: number;
}

export class Cena {
  readonly renderer: THREE.WebGLRenderer | null;
  readonly ok: boolean;
  estilo: Estilo = 'pixel';
  chamadas = 0;
  triangulos = 0;
  arquivos: readonly string[] = [];

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
  private readonly pontos: THREE.Points;
  private readonly faíscas: Faísca[] = [];
  private visual: Visual | null = null;
  private segmentos: THREE.Group[] = [];
  private comprimento = 40;
  private vivos = new Map<number, THREE.Object3D>();
  private pools = new Map<string, THREE.Object3D[]>();
  private tempo = 0;
  private observer: ResizeObserver;

  constructor(private host: HTMLElement) {
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'default' });
    } catch {
      renderer = null;
    }
    this.renderer = renderer;
    this.ok = !!renderer?.getContext();
    if (!renderer || !this.ok) {
      this.observer = new ResizeObserver(() => undefined);
      this.pontos = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
      return;
    }
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x9ad8ff);
    renderer.domElement.className = 'tela-jogo';
    renderer.domElement.setAttribute('aria-label', 'Corrida do Samuel');
    host.append(renderer.domElement);
    this.scene.fog = new THREE.Fog(0xbfe6ff, 62, 190);
    this.scene.add(new THREE.HemisphereLight(0xe6f6ff, 0x4a5a6e, 2.2));
    const sol = new THREE.DirectionalLight(0xfff1cc, 3);
    sol.position.set(-8, 18, -3);
    sol.castShadow = false;
    this.scene.add(sol);
    const enchimento = new THREE.DirectionalLight(0xffffff, 0.8);
    enchimento.position.set(6, 6, -12);
    this.scene.add(enchimento);
    this.camera.position.set(0, 5.4, -10.2);
    this.camera.lookAt(0, 2.2, 12);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48 * 3), 3));
    this.pontos = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe56a, size: 0.18, sizeAttenuation: true }));
    this.scene.add(this.pontos);
    this.observer = new ResizeObserver(() => this.redimensionar());
    this.observer.observe(host);
    this.redimensionar();
  }

  async usar(estilo: Estilo): Promise<void> {
    if (!this.ok) return;
    this.limpar();
    this.estilo = estilo;
    this.visual = estilo === 'blocos'
      ? await (await import('./estilo-blocos')).montarBlocos()
      : await montarPixel();
    this.arquivos = this.visual.arquivos;
    this.scene.add(this.visual.samuel);
    this.scene.add(this.visual.dog);
    for (let i = 0; i < 2; i++) {
      const grupo = new THREE.Group();
      await this.visual.montarPista(grupo, this.comprimento, i === 0);
      grupo.position.z = i * this.comprimento;
      this.scene.add(grupo);
      this.segmentos.push(grupo);
    }
    this.visual.atualizar(null, 0);
  }

  desenhar(foto: Foto | null, entidades: Entidade[], delta: number, dt: number): void {
    if (!this.renderer || !this.ok) return;
    this.tempo += dt;
    if (delta > 0) this.rolar(delta);
    this.visual?.atualizar(foto, this.tempo);
    this.sincronizar(entidades);
    this.animarFaíscas(dt);
    const alvo = (foto?.x ?? 0) * CONFIG.faixa * 0.22;
    this.camera.position.x += (alvo - this.camera.position.x) * Math.min(1, dt * 3);
    this.camera.position.y = 5.4;
    this.camera.position.z = -10.2;
    this.camera.lookAt(this.camera.position.x * 0.2, 2.2, 12);
    this.renderer.render(this.scene, this.camera);
    this.chamadas = this.renderer.info.render.calls;
    this.triangulos = this.renderer.info.render.triangles;
  }

  particulas(faixa: Faixa, z: number): void {
    for (let i = 0; i < 8 && this.faíscas.length < 48; i++) {
      this.faíscas.push({
        x: faixa * CONFIG.faixa,
        y: 0.9,
        z,
        vx: (Math.random() - 0.5) * 2.2,
        vy: 1.4 + Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 1.2,
        vida: 0.38,
      });
    }
  }

  private rolar(delta: number): void {
    const volta = this.comprimento * this.segmentos.length;
    for (const grupo of this.segmentos) {
      grupo.position.z -= delta;
      if (grupo.position.z < -this.comprimento) grupo.position.z += volta;
    }
  }

  private sincronizar(lista: Entidade[]): void {
    if (!this.visual) return;
    const ativos = new Set<number>();
    for (const entidade of lista) {
      if (!entidade.ativa) continue;
      ativos.add(entidade.id);
      let obj = this.vivos.get(entidade.id);
      if (!obj) {
        obj = this.obterDoPool(entidade.tipo) ?? this.visual.criar(entidade.tipo);
        obj.userData.tipo = entidade.tipo;
        this.vivos.set(entidade.id, obj);
        this.scene.add(obj);
      }
      obj.visible = entidade.z < 58 && entidade.z > -8;
      obj.position.set(
        entidade.faixa * CONFIG.faixa,
        Number(obj.userData.y) || 0,
        entidade.z + (Number(obj.userData.dz) || 0),
      );
    }
    for (const [id, obj] of this.vivos) {
      if (ativos.has(id)) continue;
      this.vivos.delete(id);
      this.scene.remove(obj);
      const tipo = String(obj.userData.tipo);
      const pool = this.pools.get(tipo) ?? [];
      pool.push(obj);
      this.pools.set(tipo, pool);
    }
  }

  private obterDoPool(tipo: string): THREE.Object3D | undefined {
    return this.pools.get(tipo)?.pop();
  }

  private animarFaíscas(dt: number): void {
    const pos = this.pontos.geometry.getAttribute('position') as THREE.BufferAttribute;
    let n = 0;
    for (const f of this.faíscas) {
      f.vida -= dt;
      if (f.vida <= 0) continue;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.z += f.vz * dt;
      f.vy -= dt * 3;
      pos.setXYZ(n, f.x, f.y, f.z);
      n += 1;
    }
    for (let i = this.faíscas.length - 1; i >= 0; i--) if (this.faíscas[i].vida <= 0) this.faíscas.splice(i, 1);
    for (let i = n; i < pos.count; i++) pos.setXYZ(i, 0, -10, 0);
    pos.needsUpdate = true;
    this.pontos.visible = n > 0;
  }

  private limpar(): void {
    for (const obj of this.vivos.values()) this.scene.remove(obj);
    for (const lista of this.pools.values()) lista.forEach((obj) => this.scene.remove(obj));
    this.vivos.clear();
    this.pools.clear();
    for (const grupo of this.segmentos) this.scene.remove(grupo);
    this.segmentos = [];
    this.visual?.descartar();
    this.visual = null;
    this.arquivos = [];
  }

  private redimensionar = (): void => {
    if (!this.renderer) return;
    const largura = Math.max(1, this.host.clientWidth);
    const altura = Math.max(1, this.host.clientHeight);
    this.camera.aspect = largura / altura;
    this.camera.fov = this.camera.aspect < 0.9 ? 68 : 57;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.pixelRatioMax));
    this.renderer.setSize(largura, altura, false);
  };
}

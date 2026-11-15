import * as THREE from "three";
import type { RunSnapshot, WorldEntity, EntityKind } from "../gameplay/RunSession";

const laneWidth = 3.1;
const railLength = 260;

export class GameScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(57, 1, 0.1, 400);
  private entityObjects = new Map<number, THREE.Object3D>();
  private pools = new Map<EntityKind, THREE.Object3D[]>();
  private runner?: THREE.Sprite;
  private runnerMaterial?: THREE.SpriteMaterial;
  private trackSegments: THREE.Group[] = [];
  private clock = 0;
  private running = false;
  private settings = { reducedMotion: false, highContrast: false, screenShake: true };
  private shake = 0;

  constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.className = "game-canvas";
    this.host.append(this.renderer.domElement);
    this.camera.position.set(0, 5.4, -10.2);
    this.camera.lookAt(0, 2.2, 12);
    this.buildWorld();
    this.loadRunner();
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  setSettings(reducedMotion: boolean, highContrast: boolean, screenShake: boolean): void {
    this.settings = { reducedMotion, highContrast, screenShake };
  }

  setRunning(running: boolean): void {
    this.running = running;
  }

  triggerShake(): void {
    if (this.settings.screenShake && !this.settings.reducedMotion) this.shake = 0.35;
  }

  render(snapshot: RunSnapshot | undefined, entities: WorldEntity[], dt: number): void {
    this.clock += dt;
    if (snapshot) {
      this.syncEntities(entities);
      this.updateRunner(snapshot);
      this.updateTrack(snapshot.speed * dt);
      const sway = this.settings.reducedMotion ? 0 : Math.sin(this.clock * 2.2) * 0.04;
      this.camera.position.x += ((snapshot.playerX * 0.42 + sway) - this.camera.position.x) * Math.min(1, dt * 5);
      this.camera.position.y = 5.4 + snapshot.playerY * 0.16 + (this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.6);
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    window.removeEventListener("resize", this.resize);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize = (): void => {
    const { clientWidth, clientHeight } = this.host;
    this.camera.aspect = Math.max(0.3, clientWidth / Math.max(1, clientHeight));
    this.camera.fov = this.camera.aspect < 0.8 ? 70 : 57;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
  };

  private buildWorld(): void {
    const worldPlate = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/metro-dash-world.png`);
    worldPlate.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = worldPlate;
    this.scene.fog = new THREE.Fog(0xa7ddf0, 62, 190);
    const hemi = new THREE.HemisphereLight(0xc8f1ff, 0x23344b, 2.2);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1cc, 3.6);
    sun.position.set(-8, 18, -3);
    this.scene.add(sun);

    for (let i = 0; i < 26; i++) {
      const segment = this.makeTrackSegment(i);
      segment.position.z = i * 10 - 20;
      this.trackSegments.push(segment);
      this.scene.add(segment);
    }

    const skyline = new THREE.Group();
    const colors = [0x137bb7, 0x2b91c7, 0x526bc1, 0x16a5ba, 0xe56a52];
    for (let i = 0; i < 42; i++) {
      const w = 3 + Math.random() * 5;
      const h = 7 + Math.random() * 22;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 4 + Math.random() * 4),
        new THREE.MeshLambertMaterial({ color: colors[i % colors.length] })
      );
      const side = i % 2 ? 1 : -1;
      building.position.set(side * (13 + Math.random() * 24), h / 2 - 1, 28 + i * 5);
      skyline.add(building);
      for (let floor = 1.5; floor < h - 1; floor += 2.4) {
        const windowStrip = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.72, 0.7, 0.04),
          new THREE.MeshBasicMaterial({ color: i % 3 ? 0xbdeeff : 0xffd561 })
        );
        windowStrip.position.set(building.position.x, floor, building.position.z - (building.geometry.parameters.depth / 2 + 0.03));
        skyline.add(windowStrip);
      }
    }
    // The generated distant world plate supplies skyline depth; keeping the
    // procedural buildings detached avoids duplicate silhouettes and draw calls.

    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(8, 32), new THREE.MeshBasicMaterial({ color: 0xffe39a }));
    sunDisc.position.set(-28, 27, 110);
  }

  private makeTrackSegment(index: number): THREE.Group {
    const group = new THREE.Group();
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 10), new THREE.MeshLambertMaterial({ color: index % 2 ? 0x58657a : 0x627087 }));
    ballast.position.y = -0.3;
    group.add(ballast);
    for (const lane of [-1, 0, 1]) {
      for (const side of [-0.72, 0.72]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xc3d4df, metalness: 0.8, roughness: 0.25 }));
        rail.position.set(lane * laneWidth + side, 0.08, 0);
        group.add(rail);
      }
      for (let z = -4.5; z <= 4.5; z += 1.05) {
        const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.13, 0.28), new THREE.MeshLambertMaterial({ color: 0x6c4333 }));
        sleeper.position.set(lane * laneWidth, -0.02, z);
        group.add(sleeper);
      }
    }
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.25, 10), new THREE.MeshLambertMaterial({ color: index % 3 === 0 ? 0xff5b43 : 0x183a64 }));
    leftWall.position.set(-7.25, 0.25, 0);
    group.add(leftWall);
    const rightWall = leftWall.clone();
    rightWall.position.x = 7.25;
    group.add(rightWall);
    return group;
  }

  private loadRunner(): void {
    const texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}assets/rook-sprites.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(0.25, 0.5);
    texture.offset.set(0.25, 0.5);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, alphaTest: 0.04 });
    const runner = new THREE.Sprite(material);
    runner.scale.set(4.6, 4.6, 1);
    runner.position.set(0, 2.25, 0);
    this.runnerMaterial = material;
    this.runner = runner;
    this.scene.add(runner);
  }

  private updateRunner(snapshot: RunSnapshot): void {
    if (!this.runner || !this.runnerMaterial?.map) return;
    const x = snapshot.playerX * laneWidth;
    this.runner.position.x += (x - this.runner.position.x) * 0.3;
    this.runner.position.y = 2.2 + snapshot.playerY;
    let frame = Math.floor(this.clock * 11) % 2 ? 1 : 2;
    if (snapshot.rolling) frame = 6;
    else if (snapshot.jumping) frame = 5;
    else if (snapshot.playerX < snapshot.lane - 0.05) frame = 4;
    else if (snapshot.playerX > snapshot.lane + 0.05) frame = 3;
    const col = frame % 4;
    const row = Math.floor(frame / 4);
    this.runnerMaterial.map.offset.set(col * 0.25, row === 0 ? 0.5 : 0);
    this.runnerMaterial.color.set(snapshot.protected ? 0x8ffbff : 0xffffff);
    this.runner.scale.set(snapshot.rolling ? 4.25 : 4.6, snapshot.rolling ? 3.55 : 4.6, 1);
  }

  private updateTrack(distance: number): void {
    if (!this.running) return;
    for (const segment of this.trackSegments) {
      segment.position.z -= distance;
      if (segment.position.z < -25) segment.position.z += railLength;
    }
  }

  private syncEntities(entities: WorldEntity[]): void {
    const activeIds = new Set<number>();
    for (const entity of entities) {
      if (!entity.active) continue;
      activeIds.add(entity.id);
      let object = this.entityObjects.get(entity.id);
      if (!object) {
        object = this.acquire(entity.kind);
        this.entityObjects.set(entity.id, object);
        this.scene.add(object);
      }
      object.visible = true;
      object.position.x = entity.lane * laneWidth;
      object.position.z = entity.z;
      object.rotation.y = entity.kind === "coin" ? this.clock * 5 : entity.kind === "cart" ? Math.sin(this.clock * 2) * 0.12 : 0;
      if (entity.kind === "coin") object.position.y = 1.1 + Math.sin(this.clock * 6 + entity.id) * 0.12;
    }
    for (const [id, object] of this.entityObjects) {
      if (!activeIds.has(id)) {
        this.entityObjects.delete(id);
        object.visible = false;
        this.scene.remove(object);
        const kind = object.userData.kind as EntityKind;
        const pool = this.pools.get(kind) ?? [];
        pool.push(object);
        this.pools.set(kind, pool);
      }
    }
  }

  private acquire(kind: EntityKind): THREE.Object3D {
    const pool = this.pools.get(kind);
    const reused = pool?.pop();
    if (reused) return reused;
    const object = this.createEntityObject(kind);
    object.userData.kind = kind;
    return object;
  }

  private createEntityObject(kind: EntityKind): THREE.Object3D {
    if (kind === "coin") {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.13, 18),
        new THREE.MeshStandardMaterial({ color: 0xffcf26, emissive: 0x8a4d00, emissiveIntensity: 0.28, metalness: 0.45, roughness: 0.24 })
      );
      coin.rotation.z = Math.PI / 2;
      const inset = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.145, 18), new THREE.MeshBasicMaterial({ color: 0xffee73 }));
      inset.rotation.z = Math.PI / 2;
      coin.add(inset);
      return coin;
    }
    if (["magnet", "shield", "multiplier", "sneakers", "board"].includes(kind)) {
      const group = new THREE.Group();
      const color = kind === "shield" ? 0x68ddff : kind === "multiplier" ? 0xff5bdb : kind === "sneakers" ? 0xa8ff4f : kind === "board" ? 0xff5b43 : 0x23e7ef;
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.25 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.09, 10, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ring.rotation.x = Math.PI / 2;
      group.add(orb, ring);
      group.position.y = 1.25;
      return group;
    }
    const group = new THREE.Group();
    const outlineMaterial = new THREE.MeshStandardMaterial({ color: this.settings.highContrast ? 0xffff00 : 0x101b2c, roughness: 0.7 });
    if (kind === "low" || kind === "crates" || kind === "cart") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(kind === "crates" ? 2.1 : 2.5, kind === "cart" ? 1 : 0.85, 1), new THREE.MeshLambertMaterial({ color: kind === "crates" ? 0xaa6236 : kind === "cart" ? 0x23e7ef : 0xffb21c }));
      base.position.y = 0.45;
      group.add(base);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.16, 1.04), outlineMaterial);
      stripe.position.y = 0.54;
      group.add(stripe);
    } else if (kind === "high") {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.62, 0.65), new THREE.MeshLambertMaterial({ color: 0xff5b43 }));
      beam.position.y = 2.25;
      const posts = [-1.2, 1.2].map((x) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.3, 0.45), outlineMaterial);
        post.position.set(x, 1.15, 0);
        return post;
      });
      group.add(beam, ...posts);
    } else if (kind === "train") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.6, 8), new THREE.MeshStandardMaterial({ color: 0xf1f5f6, roughness: 0.35, metalness: 0.15 }));
      body.position.y = 1.8;
      const face = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.5, 0.08), new THREE.MeshStandardMaterial({ color: 0x11243c, emissive: 0x061526, emissiveIntensity: 0.45 }));
      face.position.set(0, 2.25, -4.04);
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.32, 8.05), new THREE.MeshLambertMaterial({ color: 0xff5b43 }));
      band.position.set(0, 1.1, 0);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0x9cffff });
      const lights = [-0.78, 0.78].map((x) => {
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.58, 0.1), lightMat);
        light.position.set(x, 1.8, -4.1);
        return light;
      });
      group.add(body, face, band, ...lights);
    } else {
      const blocker = new THREE.Mesh(new THREE.BoxGeometry(2.45, kind === "signal" ? 3.5 : 2.1, 1.1), new THREE.MeshLambertMaterial({ color: kind === "cones" ? 0xff6b2c : kind === "signal" ? 0xff334c : 0x2463eb }));
      blocker.position.y = kind === "signal" ? 1.75 : 1.05;
      group.add(blocker);
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mark.position.set(0, 1.25, -0.58);
      group.add(mark);
    }
    return group;
  }
}

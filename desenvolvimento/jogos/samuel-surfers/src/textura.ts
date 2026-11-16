import * as THREE from 'three';

export function carregarTextura(url: string, repetir?: { u: number; v: number }): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = repetir ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      tex.wrapT = repetir ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      if (repetir) tex.repeat.set(repetir.u, repetir.v);
      resolve(tex);
    }, undefined, () => reject(new Error('textura ' + url)));
  });
}

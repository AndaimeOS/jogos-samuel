import type * as THREE from 'three';
import type { Foto, TipoEntidade } from './tipos';

export interface Visual {
  readonly arquivos: readonly string[];
  readonly samuel: THREE.Object3D;
  readonly dog: THREE.Object3D;
  atualizar(foto: Foto | null, tempo: number): string;
  criar(tipo: TipoEntidade): THREE.Object3D;
  montarPista(grupo: THREE.Group, comprimento: number, ceu: boolean): Promise<void>;
  descartar(): void;
}

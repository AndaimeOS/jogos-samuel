import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Saída vai para a pasta servida pelo porteiro do portal: /jogo/corrida-do-jack/
const saida = fileURLToPath(new URL('../../../_privado/jogos/corrida-do-jack', import.meta.url));

export default defineConfig({
  base: './',
  build: { outDir: saida, emptyOutDir: true, assetsDir: 'assets', sourcemap: false, target: 'es2020', chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});

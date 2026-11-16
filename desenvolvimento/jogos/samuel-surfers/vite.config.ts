import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const saida = fileURLToPath(new URL('../../../_privado/jogos/samuel-surfers', import.meta.url));

export default defineConfig({
  base: './',
  build: {
    outDir: saida,
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.js'],
    testTimeout: 15000,
  },
});

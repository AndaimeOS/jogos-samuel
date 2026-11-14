import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
if (!globalThis.SAT) {
  globalThis.SAT = require('../../../../_privado/jogos/pebolim/js/SAT.js');
}

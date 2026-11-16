import './estilo.css';
import { Jogo } from './jogo';

const raiz = document.getElementById('app');
if (raiz) new Jogo(raiz);

/* Reescrito a partir de desenvolvimento/jogos/pokemon-survivors/src/engine/input.ts
   (joystick, fixedJoystick, gripDown/Move/Up; Copyright (c) 2026 Pedro Barretto, MIT).
   Sem gamepad, sem remap e sem mira. O desenho na tela continua o quadrado do kit. */

/** Deslocamento máximo do knob (px CSS). */
export const RAIO_STICK = 52;
/** Tremor do dedo abaixo disto (px CSS) não anda. */
const ZONA_MORTA = 8;
/** A velocidade chega a 1 nesta fração do raio, para a borda não ser um alvo fino. */
const CHEIO_EM = 0.75;

const vetorStick = (dx, dy, percurso) => {
  const velocidade = Math.min(1, Math.max(0, (percurso - ZONA_MORTA) / (RAIO_STICK * CHEIO_EM - ZONA_MORTA)));
  return velocidade > 0 ? { x: (dx / percurso) * velocidade, y: (dy / percurso) * velocidade } : { x: 0, y: 0 };
};

/**
 * Stick flutuante: passou do raio, a base acompanha o dedo, então inverter
 * a direção é imediato. Dentro da zona morta, parado.
 */
export const joystick = (origem, ponteiro) => {
  let dx = ponteiro.x - origem.x;
  let dy = ponteiro.y - origem.y;
  const len = Math.hypot(dx, dy);
  let base = origem;
  if (len > RAIO_STICK) {
    const k = RAIO_STICK / len;
    base = { x: ponteiro.x - dx * k, y: ponteiro.y - dy * k };
    dx *= k;
    dy *= k;
  }
  return { origem: base, knob: { x: base.x + dx, y: base.y + dy }, vec: vetorStick(dx, dy, Math.min(len, RAIO_STICK)) };
};

/** Um toque a esta distância do centro do stick fixo ainda agarra: duas vezes o raio. */
export const ALCANCE_STICK_FIXO = RAIO_STICK * 2;

/** Stick fixo: a base não anda e o knob para na borda. Mesma zona morta e rampa. */
export const joystickFixo = (centro, ponteiro) => {
  const dx = ponteiro.x - centro.x;
  const dy = ponteiro.y - centro.y;
  const len = Math.hypot(dx, dy);
  const k = len > RAIO_STICK ? RAIO_STICK / len : 1;
  return {
    origem: centro,
    knob: { x: centro.x + dx * k, y: centro.y + dy * k },
    vec: vetorStick(dx * k, dy * k, len * k),
  };
};

/**
 * Quem segura o stick depois de um ponteiro descer. O primeiro dedo pega;
 * os seguintes não, a menos que o novo seja primário (o anterior se perdeu).
 * Stick fixo só responde dentro do alcance (`fixo` é o centro, ou null se flutua).
 */
export const agarreDesceu = (agarre, desceu, fixo) => {
  if (agarre && !desceu.primario) return agarre;
  if (fixo && Math.hypot(desceu.em.x - fixo.x, desceu.em.y - fixo.y) > ALCANCE_STICK_FIXO) return null;
  return {
    id: desceu.id,
    ancora: fixo,
    stick: fixo ? joystickFixo(fixo, desceu.em) : joystick(desceu.em, desceu.em),
  };
};

export const agarreMoveu = (agarre, id, em) =>
  agarre && agarre.id === id
    ? { ...agarre, stick: agarre.ancora ? joystickFixo(agarre.ancora, em) : joystick(agarre.stick.origem, em) }
    : agarre;

export const agarreSoltou = (agarre, id) => (agarre && agarre.id === id ? null : agarre);

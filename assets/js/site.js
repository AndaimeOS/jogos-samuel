/* samuel.tech — interações da interface (o acesso é controlado no servidor). */
'use strict';
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const guardar = {
    ler(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
    gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- Avisos (toast) ----------
  let timer;
  function avisar(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => (t.hidden = true), 2400);
  }

  // ---------- Confirmação antes de ações sem volta ----------
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-confirmar]');
    if (f && !window.confirm(f.dataset.confirmar)) e.preventDefault();
  });

  // ---------- Diálogos ----------
  document.addEventListener('click', (e) => {
    const abre = e.target.closest('[data-open]');
    if (abre) { const d = $(abre.dataset.open); if (d && !d.open) d.showModal(); }
    const fecha = e.target.closest('[data-close]');
    if (fecha) fecha.closest('dialog').close();
  });

  // ---------- Biblioteca: favoritos por explorador, filtro e busca ----------
  const bib = $('[data-biblioteca]');
  if (bib) {
    const chave = 'samuel-tech:favoritos:' + bib.dataset.perfil;
    let favoritos = guardar.ler(chave, []);
    if (!Array.isArray(favoritos)) favoritos = [];
    let filtro = 'all';
    const busca = $('#search');

    function desenhar() {
      const q = busca.value.trim().toLocaleLowerCase('pt-BR');
      let algum = false;
      $$('[data-card]').forEach((card) => {
        const id = card.dataset.card;
        const fav = favoritos.includes(id);
        const estrela = $('[data-favorite]', card);
        if (estrela) {
          estrela.setAttribute('aria-pressed', String(fav));
          estrela.textContent = fav ? '★' : '☆';
          estrela.setAttribute('aria-label', (fav ? 'Remover ' : 'Adicionar ') + $('h3', card).textContent + (fav ? ' dos favoritos' : ' aos favoritos'));
        }
        const mostra = (filtro !== 'favorite' || fav) && card.dataset.title.includes(q);
        card.hidden = !mostra;
        if (mostra) algum = true;
      });
      const vazio = $('#vazio');
      if (vazio) vazio.hidden = algum;
    }

    bib.addEventListener('click', (e) => {
      const estrela = e.target.closest('[data-favorite]');
      if (estrela) {
        const id = estrela.dataset.favorite;
        favoritos = favoritos.includes(id) ? favoritos.filter((v) => v !== id) : [...favoritos, id];
        guardar.gravar(chave, favoritos);
        desenhar();
        if (estrela.closest('[data-card]').hidden) $('[data-filter="favorite"]').focus();
        avisar(favoritos.includes(id) ? 'Mundo salvo nos favoritos!' : 'Mundo removido dos favoritos.');
      }
      const f = e.target.closest('[data-filter]');
      if (f) {
        filtro = f.dataset.filter;
        $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
        desenhar();
      }
    });
    busca.addEventListener('input', desenhar);
    desenhar();
  }

  // ---------- Tela cheia (player) ----------
  // No iPad o Safari muitas vezes não tem requestFullscreen (ou só a variante
  // webkit, que pode não devolver uma Promise). Sem a API, a moldura cresce
  // na própria página — o clique nunca pode estourar.
  function pedirTelaCheia(el) {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
    return typeof fn === 'function' ? fn : null;
  }
  function sairTelaCheiaNativa() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
    return typeof fn === 'function' ? fn : null;
  }
  function emTelaCheiaNativa() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement);
  }
  function sincronizarTelaCheia(moldura, tela) {
    const ligada = emTelaCheiaNativa() || moldura.classList.contains('player-cheia');
    tela.setAttribute('aria-pressed', ligada ? 'true' : 'false');
  }
  function usarTelaCheiaCss(moldura, tela) {
    moldura.classList.add('player-cheia');
    document.body.classList.add('player-tela-cheia');
    tela.setAttribute('aria-pressed', 'true');
  }
  function alternarTelaCheia(moldura, tela) {
    if (emTelaCheiaNativa() || moldura.classList.contains('player-cheia')) {
      const sair = sairTelaCheiaNativa();
      if (emTelaCheiaNativa() && sair) {
        try {
          const resultado = sair.call(document);
          if (resultado && typeof resultado.catch === 'function') resultado.catch(() => avisar('Tela cheia não disponível aqui.'));
        } catch {
          avisar('Tela cheia não disponível aqui.');
        }
      }
      moldura.classList.remove('player-cheia');
      document.body.classList.remove('player-tela-cheia');
      tela.setAttribute('aria-pressed', 'false');
      return;
    }
    const pedir = pedirTelaCheia(moldura);
    const api = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (pedir && api) {
      try {
        const resultado = pedir.call(moldura);
        if (resultado && typeof resultado.then === 'function') {
          resultado.then(() => tela.setAttribute('aria-pressed', 'true')).catch(() => usarTelaCheiaCss(moldura, tela));
          return;
        }
        tela.setAttribute('aria-pressed', 'true');
        return;
      } catch {
        /* o Safari recusou; segue o fallback visual */
      }
    }
    usarTelaCheiaCss(moldura, tela);
  }

  // ---------- Player ----------
  const jogo = $('#jogo');
  if (jogo) {
    const carregando = $('#carregando');
    let espera;
    function aguardar() {
      if (!carregando) return;
      carregando.hidden = false;
      $('[data-demora]', carregando).hidden = true;
      clearTimeout(espera);
      espera = setTimeout(() => { $('[data-demora]', carregando).hidden = false; }, 15000);
    }
    $$('[data-recomecar]').forEach((b) => b.addEventListener('click', () => {
      aguardar();
      jogo.src = jogo.src;   // recarrega o jogo do zero
      jogo.focus();
    }));
    jogo.addEventListener('load', () => { clearTimeout(espera); if (carregando) carregando.hidden = true; });
    aguardar();
    try {   // o jogo pode ter carregado antes deste script rodar
      const d = jogo.contentDocument;
      if (d && d.readyState === 'complete' && jogo.contentWindow.location.href !== 'about:blank') { clearTimeout(espera); carregando.hidden = true; }
    } catch {}
    const moldura = $('#moldura');
    // Celular e iPad deitado (até ~900px de altura, só toque): rola até o jogo.
    // No iPad em paisagem a moldura começa abaixo da dobra e o botão de jogar some.
    const consultaTela = '(max-width:760px), (max-height:560px), ((max-height:900px) and (pointer: coarse))';
    function encaixarJogo() {
      if (!moldura || !matchMedia(consultaTela).matches) return;
      const topo = moldura.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, topo);
    }
    setTimeout(encaixarJogo, 150);
    window.addEventListener('orientationchange', () => setTimeout(encaixarJogo, 250));
    const tela = $('[data-tela-cheia]');
    if (tela && moldura) {
      tela.hidden = false;
      tela.setAttribute('aria-pressed', 'false');
      tela.addEventListener('click', () => alternarTelaCheia(moldura, tela));
      document.addEventListener('fullscreenchange', () => sincronizarTelaCheia(moldura, tela));
      document.addEventListener('webkitfullscreenchange', () => sincronizarTelaCheia(moldura, tela));
      window.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && moldura.classList.contains('player-cheia')) {
          moldura.classList.remove('player-cheia');
          document.body.classList.remove('player-tela-cheia');
          tela.setAttribute('aria-pressed', 'false');
        }
      });
    }
    jogo.addEventListener('load', () => { try { jogo.contentWindow.focus(); } catch {} });
  }
})();

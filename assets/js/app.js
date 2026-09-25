/* ==========================================================================
   ponto AUTO, comportamento compartilhado
   --------------------------------------------------------------------------
   Sem build. A única dependência é a Lenis (rolagem suave, por CDN), e o site
   funciona igual sem ela. Tudo o que roda em mais de uma página mora aqui.

   Cuidados que parecem detalhe e não são:

   1. O scroll só LÊ window.scrollY. As medidas de cada trecho (altura, topo)
      ficam em cache e são recalculadas no resize e quando a página termina de
      carregar. Ler getBoundingClientRect a cada frame, logo depois de ter
      escrito uma variável CSS no frame anterior, obriga o navegador a refazer
      layout na hora. É esse vaivém que engasga o scroll no celular.

   2. Toda animação ligada à rolagem é uma variável só, --p, de 0 a 1. O JS
      escreve o número, o CSS interpola o resto.

   3. Quem pediu menos movimento no sistema não recebe abertura, vídeo,
      parallax, digitação nem rolagem suave. O site continua inteiro.

   4. Travar a página (abertura, menu, gaveta, lupa) passa SEMPRE por
      travar()/destravar(): elas cuidam da classe no body e da Lenis juntas.
   ========================================================================== */

(function () {
  'use strict';

  const paradoQuieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Tela de toque (celular, tablet): lá a rolagem roda fora do JavaScript, e
     todo efeito recalculado a cada quadro da rolagem (parallax) chega
     atrasado e anda aos pulinhos, a sensação de 15 Hz. Nesses aparelhos o
     parallax e o desfoque de vidro saem; o resto das animações fica. */
  const toque = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (toque) document.documentElement.classList.add('toque');
  const gravando = window.__gravacao === true;   // ligado pelo gravador do vídeo de demonstração
  const $ = (s, e = document) => e.querySelector(s);
  const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
  const ico = (n) => `<svg class="icone" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  window.ico = ico;

  /* ---------- 0. travar a página e rolagem suave ------------------------- */

  let lenis = null;
  function travar() { document.body.classList.add('travado'); if (lenis) lenis.stop(); }
  function destravar() { document.body.classList.remove('travado'); if (lenis) lenis.start(); }
  window.pontoAuto = { travar, destravar };

  /* Lenis: a rolagem desliza em vez de pular de degrau em degrau. No toque
     do celular ela não interfere (o padrão dela já é deixar o nativo). */
  function rolagemSuave() {
    if (!window.Lenis || paradoQuieto || gravando) return;
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.95, anchors: { offset: -84 } });
    const quadro = (t) => { lenis.raf(t); requestAnimationFrame(quadro); };
    requestAnimationFrame(quadro);
    if (document.body.classList.contains('travado')) lenis.stop();
  }

  /* ---------- 1. abertura ------------------------------------------------ */

  /* html.acendeu é o gatilho do carro saindo do escuro, do vídeo e da
     entrada do título (ver o CSS do hero). Liga no meio da abertura. */
  const acender = () => {
    if (document.documentElement.classList.contains('acendeu')) return;
    document.documentElement.classList.add('acendeu');
    document.dispatchEvent(new Event('pa:acendeu'));
  };

  function abertura() {
    const tela = $('#abertura');
    if (!tela) { acender(); return; }

    // Roda uma vez por sessão. Quem já viu entra direto, mas ainda vê o
    // carro acender, que é curto e é o que dá a primeira impressão.
    let jaViu = false;
    try { jaViu = sessionStorage.getItem('pa-abertura') === '1'; } catch (e) { /* aba anônima bloqueada */ }
    if (paradoQuieto || jaViu) {
      tela.remove();
      destravar();
      acender();
      return;
    }

    travar();
    tela.classList.add('roda');

    let encerrou = false;
    const encerrar = () => {
      if (encerrou) return;
      encerrou = true;
      try { sessionStorage.setItem('pa-abertura', '1'); } catch (e) { /* segue sem lembrar */ }
      tela.classList.add('abriu');
      destravar();
      // a cortina leva ~1s para abrir; o carro começa a acender no meio dela
      setTimeout(acender, 380);
      setTimeout(() => tela.remove(), 1200);
    };

    // a cortina só abre com o vídeo pronto (no máximo 2 s além dos 2,6 s da marca)
    let t = setTimeout(() => {
      t = setTimeout(encerrar, 2000);
      videoPronto.then(() => { clearTimeout(t); encerrar(); });
    }, 2600);
    const pular = () => { clearTimeout(t); encerrar(); };
    tela.addEventListener('click', pular);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === ' ') pular(); }, { once: true });
    window.addEventListener('wheel', pular, { once: true, passive: true });
    window.addEventListener('touchstart', pular, { once: true, passive: true });
  }

  /* ---------- 2. vídeo do hero ------------------------------------------- */

  /* O vídeo começa a baixar e a TOCAR escondido já no primeiro instante,
     atrás da cortina da abertura: quando ela abre, ele está decodificado e
     em qualidade cheia, sem entrar pixelado. No acender ele volta para o
     zero, para o farol (1,2 s do vídeo) pulsar com o carro quase aceso.
     1080p em tela grande, 720p no celular. Quem pediu menos movimento ou está
     com economia de dados nem baixa: fica a foto. */
  let videoPronto = Promise.resolve();
  function videoHero() {
    const v = $('.hero__video');
    if (!v) return;
    const economia = navigator.connection && navigator.connection.saveData;
    if (paradoQuieto || economia) { v.remove(); return; }

    // quantos pixels a tela tem de verdade: 1440p em monitor grande ou retina, 1080p no notebook, 720p no celular
    const px = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1);
    const base = v.dataset.video + (innerWidth < 760 ? '-720' : px >= 2200 ? '-1440' : '-1080');
    v.muted = true;
    v.playsInline = true;
    v.innerHTML = '<source src="' + base + '.webm" type="video/webm"><source src="' + base + '.mp4" type="video/mp4">';
    v.preload = 'auto';
    v.load();

    videoPronto = new Promise((ok) => {
      if (v.readyState >= 3) return ok();
      v.addEventListener('canplaythrough', ok, { once: true });
      v.addEventListener('error', ok, { once: true });
    });

    let visivel = true;
    const tocar = () => {
      if (!visivel) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => { /* autoplay bloqueado (modo economia do iPhone): fica a foto */ });
    };
    v.addEventListener('playing', () => v.classList.add('tocando'), { once: true });
    tocar();   // já roda escondido atrás da abertura
    const doZero = () => { try { v.currentTime = 0; } catch (e) { /* ainda sem dados */ } tocar(); };
    if (document.documentElement.classList.contains('acendeu')) doZero();
    else document.addEventListener('pa:acendeu', doZero, { once: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (!document.documentElement.classList.contains('acendeu')) return;
        if (visivel) tocar(); else v.pause();
      }).observe(v.closest('.hero'));
    }
  }

  /* ---------- 3. cabeçalho e menu ---------------------------------------- */

  function cabecalho() {
    const topo = $('#topo');
    const menu = $('#menu');
    const abrir = $('#abre-menu');
    const fechar = $('#fecha-menu');

    if (topo && !topo.classList.contains('topo--solido')) {
      const marcar = () => topo.classList.toggle('encolheu', window.scrollY > 40);
      marcar();
      aoRolar(marcar);
    }

    if (!menu || !abrir) return;
    /* Fechado, o menu fica `inert`: sem isso os links escondidos pelo
       clip-path continuam recebendo Tab. E o foco volta para o botão ANTES de
       esconder o menu, senão o navegador reclama de foco dentro de algo com
       aria-hidden (apareceu no console no teste). */
    menu.inert = true;
    const alterna = (estado) => {
      if (!estado) abrir.focus();
      menu.classList.toggle('aberto', estado);
      menu.setAttribute('aria-hidden', String(!estado));
      menu.inert = !estado;
      abrir.setAttribute('aria-expanded', String(estado));
      if (estado) travar(); else destravar();
      if (estado) setTimeout(() => $('.menu__lista a', menu)?.focus(), 400);
    };
    abrir.addEventListener('click', () => alterna(true));
    fechar?.addEventListener('click', () => alterna(false));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => alterna(false)));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) alterna(false);
    });
  }

  /* ---------- 4. fila única de scroll ------------------------------------ */

  const tarefas = [];
  let agendado = false;
  function aoRolar(fn) { tarefas.push(fn); }
  function rodarFila() {
    agendado = false;
    for (const fn of tarefas) fn();
  }
  window.addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(rodarFila);
  }, { passive: true });

  /* ---------- 5. parallax dirigido pelo scroll --------------------------- */

  /* Qualquer elemento com data-parallax recebe --p de 0 (entrando por baixo)
     a 1 (saindo por cima) enquanto cruza a tela. O CSS decide o que fazer. */
  function parallax() {
    const alvos = $$('[data-parallax]');
    if (!alvos.length || paradoQuieto || toque) return;

    let medidas = [];
    const medir = () => {
      medidas = alvos.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, topo: r.top + window.scrollY, altura: r.height };
      });
    };
    const pintar = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      for (const m of medidas) {
        const p = Math.min(1, Math.max(0, (y + vh - m.topo) / (m.altura + vh)));
        m.el.style.setProperty('--p', p.toFixed(4));
      }
    };
    const refazer = () => { medir(); pintar(); };

    refazer();
    aoRolar(pintar);
    window.addEventListener('resize', refazer, { passive: true });
    // fonte e imagem que chegam depois mudam a altura do que está acima
    window.addEventListener('load', refazer);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refazer);
  }

  /* O hero é diferente: o percurso dele é só a própria altura, contada a
     partir do topo da página, para o carro já começar parado. */
  function parallaxHero() {
    const hero = $('.hero');
    if (!hero || paradoQuieto || toque) return;
    let altura = hero.offsetHeight;
    const pintar = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / altura));
      hero.style.setProperty('--p', p.toFixed(4));
    };
    pintar();
    aoRolar(pintar);
    window.addEventListener('resize', () => { altura = hero.offsetHeight; pintar(); }, { passive: true });
  }

  /* ---------- 6. títulos que sobem por linha ----------------------------- */

  /* Cada <br> do título vira uma linha com máscara própria (CSS seção 24). */
  function tituloPorLinha() {
    $$('h2').forEach((h) => {
      if (h.classList.contains('linhas') || h.hasAttribute('data-sem-linhas')) return;
      const partes = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = partes.map((p) => `<span class="linha"><span>${p.trim()}</span></span>`).join('');
      h.classList.add('linhas');
    });
  }

  /* ---------- 7. revelação ----------------------------------------------- */

  function revelar() {
    $$('.passo').forEach((p, i) => p.style.setProperty('--n', i));
    const alvos = $$('.rev, .passos, .linhas');
    if (!alvos.length) return;
    if (paradoQuieto || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    alvos.forEach((el) => obs.observe(el));
  }

  /* ---------- 8. contadores ---------------------------------------------- */

  function contadores() {
    const alvos = $$('[data-conta]');
    if (!alvos.length) return;
    const formata = (el, v) => {
      const casas = Number(el.dataset.casas || 0);
      const txt = casas ? v.toFixed(casas).replace('.', ',') : Math.round(v).toLocaleString('pt-BR');
      return (el.dataset.antes || '') + txt + (el.dataset.depois || '');
    };
    if (paradoQuieto || !('IntersectionObserver' in window)) {
      alvos.forEach((el) => { el.textContent = formata(el, Number(el.dataset.conta)); });
      return;
    }
    const anima = (el) => {
      const fim = Number(el.dataset.conta);
      const dur = 1500;
      const t0 = performance.now();
      const passo = (agora) => {
        const t = Math.min(1, (agora - t0) / dur);
        el.textContent = formata(el, fim * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        anima(e.target);
        obs.unobserve(e.target);
      }
    }, { threshold: 0.5 });
    alvos.forEach((el) => obs.observe(el));
  }

  /* ---------- 9. cartão de veículo (home, estoque, página do carro) ------ */

  function cartaoCarro(c, classes = '') {
    const selos = [];
    if (c.selo) selos.push(`<span class="selo selo--acento">${c.selo}</span>`);
    if (c.precoDe) selos.push(`<span class="selo selo--ok">${ico('trending-up')}Baixou</span>`);
    return `
      <article class="carro ${classes}">
        <div class="carro__foto">
          <img src="${c.foto}" alt="${c.marca} ${c.modelo} ${c.versao}, ${c.ano}" loading="lazy" width="800" height="600">
          ${selos.length ? `<div class="carro__selos">${selos.join('')}</div>` : ''}
        </div>
        <div class="carro__corpo">
          <p class="carro__marca">${c.marca}</p>
          <h3 class="carro__nome">${c.modelo}</h3>
          <p class="carro__versao">${c.versao}</p>
          <div class="fichas">
            <span class="ficha">${ico('calendar')}${c.ano}/${c.anoModelo}</span>
            <span class="ficha">${ico('gauge')}${fmtKm(c.km)}</span>
            <span class="ficha">${ico('cog')}${c.cambio}</span>
          </div>
          <div class="carro__preco">
            <div>
              ${c.precoDe ? `<s>${fmtPreco(c.precoDe)}</s>` : ''}
              <b>${fmtPreco(c.preco)}</b>
            </div>
            <span class="carro__ver" aria-hidden="true">${ico('arrow-up-right')}</span>
          </div>
        </div>
        <a class="carro__link" href="veiculo.html?id=${c.id}">
          <span class="visualmente-oculto">Ver ${c.marca} ${c.modelo} ${c.versao}</span>
        </a>
      </article>`;
  }
  window.cartaoCarro = cartaoCarro;

  /* ---------- 10. vitrine: destaques da semana --------------------------- */

  /* Abas por tipo, um carro por vez. Troca com o carro saindo para um lado e
     o próximo entrando pelo outro; o nome gigante apaga e acende desfocando.
     O nome não anima com transform porque o transform dele é do parallax. */
  const TIPOS = ['SUV', 'Picape', 'Sedan', 'Hatch'];
  const nomeCurto = (c) => c.nomeCurto || c.modelo.split(' ').pop();

  function vitrine() {
    const raiz = $('#vitrine');
    if (!raiz) return;
    const abas = $('.vitrine__abas', raiz);
    const palco = $('.vitrine__palco', raiz);
    const foto = $('.vitrine__carro', raiz);
    const nome = $('.vitrine__nome', raiz);
    const selo = $('.vitrine__selo', raiz);
    const cont = $('.vitrine__contador', raiz);
    const info = $('.vitrine__info', raiz);
    const preco = $('.vitrine__preco', raiz);
    const ver = $('[data-ver-carro]', raiz);
    const zap = $('[data-zap-carro]', raiz);

    const porTipo = (t) => ESTOQUE.filter((c) => c.carroceria === t).sort((a, b) => b.preco - a.preco);
    let tipo = TIPOS[0];
    let lista = porTipo(tipo);
    let i = 0;
    let ocupado = false;

    abas.innerHTML = TIPOS.map((t) =>
      `<button class="vitrine__aba" type="button" role="tab" data-tipo="${t}" aria-selected="${t === tipo}">${t}<small>${porTipo(t).length}</small></button>`
    ).join('');

    function pintar(c) {
      foto.src = c.fotoG;
      foto.alt = `${c.marca} ${c.modelo} ${c.versao} no estúdio`;
      nome.textContent = nomeCurto(c);
      selo.innerHTML = c.selo ? `<span class="selo selo--acento">${c.selo}</span>` : '';
      cont.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> / ${String(lista.length).padStart(2, '0')}`;
      info.innerHTML = `
        <p class="carro__marca">${c.marca}</p>
        <h3>${c.modelo}</h3>
        <p>${c.versao}</p>
        <div class="fichas">
          <span class="ficha">${ico('calendar')}${c.ano}/${c.anoModelo}</span>
          <span class="ficha">${ico('gauge')}${fmtKm(c.km)}</span>
          <span class="ficha">${ico('fuel')}${c.combustivel}</span>
          <span class="ficha">${ico('cog')}${c.cambio}</span>
        </div>`;
      const i48 = 0.0169, fin = c.preco * 0.7;
      const parcela = fin * i48 / (1 - Math.pow(1 + i48, -48));
      preco.innerHTML = `
        ${c.precoDe ? `<s>${fmtPreco(c.precoDe)}</s>` : ''}
        <b>${fmtPreco(c.preco)}</b>
        <small>ou 30% de entrada e 48x de ${fmtPreco(Math.round(parcela))}</small>`;
      ver.href = `veiculo.html?id=${c.id}`;
      zap.href = zapCarro(c);
    }

    async function mostrar(novaLista, novoI, dir) {
      if (ocupado) return;
      const c = novaLista[novoI];
      if (paradoQuieto || !foto.animate) { lista = novaLista; i = novoI; pintar(c); return; }
      ocupado = true;
      const sai = (el, x) => el.animate(
        [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${x})` }],
        { duration: 260, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      const saidas = [
        sai(foto, dir > 0 ? '-7%' : '7%'), sai(info, dir > 0 ? '-24px' : '24px'), sai(preco, dir > 0 ? '-24px' : '24px'),
        nome.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(10px)' }], { duration: 260, fill: 'forwards' })
      ];
      await Promise.all(saidas.map((a) => a.finished.catch(() => {})));
      lista = novaLista; i = novoI;
      pintar(c);
      try { await foto.decode(); } catch (e) { /* segue mesmo sem decodificar antes */ }
      saidas.forEach((a) => a.cancel());
      const entra = (el, x, atraso) => el.animate(
        [{ opacity: 0, transform: `translateX(${x})` }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 700, delay: atraso, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
      entra(foto, dir > 0 ? '9%' : '-9%', 0);
      entra(info, dir > 0 ? '30px' : '-30px', 80);
      entra(preco, dir > 0 ? '30px' : '-30px', 140);
      nome.animate([{ opacity: 0, filter: 'blur(14px)' }, { opacity: 1, filter: 'blur(0)' }],
        { duration: 800, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
      setTimeout(() => { ocupado = false; }, 360);
    }

    abas.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tipo]');
      if (!b || b.dataset.tipo === tipo) return;
      tipo = b.dataset.tipo;
      $$('[data-tipo]', abas).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      mostrar(porTipo(tipo), 0, 1);
    });
    $$('[data-vit-ant]', raiz).forEach((b) => b.addEventListener('click', () => mostrar(lista, (i - 1 + lista.length) % lista.length, -1)));
    $$('[data-vit-prox]', raiz).forEach((b) => b.addEventListener('click', () => mostrar(lista, (i + 1) % lista.length, 1)));

    // arrastar para o lado no celular também troca de carro
    let x0 = null;
    palco.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    palco.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) < 50) return;
      mostrar(lista, dx < 0 ? (i + 1) % lista.length : (i - 1 + lista.length) % lista.length, dx < 0 ? 1 : -1);
    });

    pintar(lista[0]);
  }

  /* ---------- 11. vitrine escura: nome e preço digitados ----------------- */

  /* Ritmo fixo por letra (sem Math.random) para a digitação sair igual toda
     vez, inclusive no vídeo de demonstração gravado quadro a quadro. */
  function vitrineEscura() {
    const raiz = $('#destaque-escuro');
    if (!raiz) return;
    const campos = $$('.digita', raiz);
    const escrever = (el) => new Promise((ok) => {
      const texto = el.dataset.texto;
      const saida = $('.digita__texto', el);
      let k = 0;
      const passo = () => {
        saida.textContent = texto.slice(0, ++k);
        if (k < texto.length) setTimeout(passo, 95 + (k % 3) * 35);
        else { el.classList.add('terminou'); ok(); }
      };
      setTimeout(passo, 120);
    });
    if (paradoQuieto || !('IntersectionObserver' in window)) {
      campos.forEach((el) => { $('.digita__texto', el).textContent = el.dataset.texto; el.classList.add('terminou'); });
      return;
    }
    const obs = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      for (const el of campos) await escrever(el);
    }, { threshold: 0.35 });
    obs.observe(raiz);
  }

  /* ---------- 12. simulador de financiamento ----------------------------- */

  /* Taxa de exemplo. Num site de cliente isso vem da tabela do banco que a
     loja usa. A conta é a Price padrão: p = v * i / (1 - (1+i)^-n). */
  const TAXA_MES = 0.0169;

  function simulador() {
    const raiz = $('#simulador');
    if (!raiz) return;

    const selCarro = $('#sim-carro', raiz);
    const faixa = $('#sim-entrada', raiz);
    const vEntrada = $('#sim-valor-entrada', raiz);
    const pEntrada = $('#sim-pct-entrada', raiz);
    const chips = $$('[data-prazo]', raiz);
    const saidaParcela = $('#sim-parcela', raiz);
    const saidaFinanciado = $('#sim-financiado', raiz);
    const saidaPrazo = $('#sim-prazo', raiz);
    const saidaTotal = $('#sim-total', raiz);
    const linkZapSim = $('#sim-zap', raiz);
    const minEntrada = $('#sim-min'), maxEntrada = $('#sim-max');
    const fotoSim = $('#sim-foto img', raiz);
    const legendaSim = $('#sim-foto figcaption', raiz);

    selCarro.innerHTML = ESTOQUE
      .slice()
      .sort((a, b) => a.preco - b.preco)
      .map((c) => `<option value="${c.id}">${c.marca} ${c.modelo} ${c.versao} ${c.ano}, ${fmtPreco(c.preco)}</option>`)
      .join('');

    let prazo = 48;
    chips.forEach((ch) => ch.addEventListener('click', () => {
      chips.forEach((o) => o.setAttribute('aria-pressed', 'false'));
      ch.setAttribute('aria-pressed', 'true');
      prazo = Number(ch.dataset.prazo);
      calcular();
    }));

    function trocarFoto(c) {
      if (!fotoSim) return;
      fotoSim.src = c.foto;
      fotoSim.alt = `${c.marca} ${c.modelo} ${c.versao}`;
      legendaSim.textContent = `${c.marca} ${c.modelo} · ${c.ano}/${c.anoModelo}`;
      if (!paradoQuieto && fotoSim.animate) {
        fotoSim.animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 600, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      }
    }

    selCarro.addEventListener('change', () => {
      const c = carroPorId(selCarro.value);
      ajustarFaixa();
      faixa.value = Math.round(c.preco * 0.3);
      trocarFoto(c);
      calcular();
    });
    faixa.addEventListener('input', calcular);

    function ajustarFaixa() {
      const c = carroPorId(selCarro.value);
      faixa.min = Math.round(c.preco * 0.1);
      faixa.max = Math.round(c.preco * 0.9);
      faixa.step = 500;
      minEntrada.textContent = fmtPreco(Number(faixa.min));
      maxEntrada.textContent = fmtPreco(Number(faixa.max));
    }

    function calcular() {
      const c = carroPorId(selCarro.value);
      if (!c) return;
      const entrada = Math.min(Number(faixa.value), c.preco * 0.9);
      const financiado = c.preco - entrada;
      const i = TAXA_MES;
      const parcela = financiado * i / (1 - Math.pow(1 + i, -prazo));

      vEntrada.textContent = fmtPreco(Math.round(entrada));
      pEntrada.textContent = Math.round((entrada / c.preco) * 100) + '%';
      saidaParcela.innerHTML = fmtPreco(Math.round(parcela)) + '<span>/mês</span>';
      saidaFinanciado.textContent = fmtPreco(Math.round(financiado));
      saidaPrazo.textContent = prazo + 'x';
      saidaTotal.textContent = fmtPreco(Math.round(entrada + parcela * prazo));

      linkZapSim.href = linkZap(
        `Olá! Simulei no site: ${c.marca} ${c.modelo} ${c.versao} ${c.ano}, ` +
        `entrada de ${fmtPreco(Math.round(entrada))} em ${prazo}x de ${fmtPreco(Math.round(parcela))}. ` +
        `Queria confirmar as condições.`
      );
    }

    // Estado inicial: o Compass, carro de entrada mais procurado. A ordem
    // importa: definir value antes de min/max faz o navegador grampear o
    // valor no limite antigo e a entrada nasce no mínimo.
    const inicial = carroPorId('compass-longitude-2021') || ESTOQUE[0];
    selCarro.value = inicial.id;
    ajustarFaixa();
    faixa.value = Math.round(inicial.preco * 0.3);
    if (fotoSim) { fotoSim.src = inicial.foto; legendaSim.textContent = `${inicial.marca} ${inicial.modelo} · ${inicial.ano}/${inicial.anoModelo}`; }
    calcular();
  }

  /* ---------- 13. botão flutuante de WhatsApp ---------------------------- */

  function zapFlutuante() {
    const btn = $('#zap-flutua');
    if (!btn) return;
    const marcar = () => btn.classList.toggle('mostra', window.scrollY > window.innerHeight * 0.7);
    marcar();
    aoRolar(marcar);
  }

  /* ---------- 14. conteúdo montado a partir de dados.js ------------------ */

  function montarHome() {
    const entregas = $('#entregas');
    if (entregas) {
      entregas.innerHTML = ENTREGAS.map((e, i) => `
        <figure class="entrega rev rev--d${(i % 4) + 1}">
          <img src="${e.foto}" alt="${e.nome} recebendo o ${e.carro}" loading="lazy" width="700" height="933">
          <div class="estrelas" aria-label="5 de 5 estrelas">
            ${ico('star').replace('class="icone"', 'class="icone icone--cheio"').repeat(5)}
          </div>
          <blockquote><p>${e.texto}</p></blockquote>
          <figcaption>
            <strong>${e.nome}</strong>
            <small>${e.carro}</small>
          </figcaption>
        </figure>`).join('');
    }

    // a busca do hero leva os parâmetros para a página de estoque
    const form = $('#busca-hero');
    if (form) {
      const selMarca = $('#busca-marca', form);
      if (selMarca) {
        const marcas = Array.from(new Set(ESTOQUE.map((c) => c.marca))).sort();
        selMarca.insertAdjacentHTML('beforeend',
          marcas.map((m) => `<option value="${m}">${m}</option>`).join(''));
      }
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const p = new URLSearchParams();
        for (const [k, v] of new FormData(form)) if (v) p.set(k, v);
        location.href = 'estoque.html' + (p.toString() ? '?' + p : '');
      });
    }
  }

  /* ---------- 15. links de WhatsApp e telefone --------------------------- */

  /* A loja fictícia usa o número de mentira de dados.js. A página de venda
     do serviço (para-lojas.html) declara no <body> o número REAL de quem
     vende o site, porque ali o botão precisa chegar em alguém de verdade. */
  function preencherContatos() {
    const zap = document.body.dataset.numeroZap || LOJA.whatsapp;
    const tel = document.body.dataset.numeroTel || LOJA.telefoneLink;
    $$('[data-zap]').forEach((a) => {
      const texto = a.dataset.zap || 'Olá! Vim pelo site e queria falar com um consultor.';
      a.href = 'https://wa.me/' + zap + '?text=' + encodeURIComponent(texto);
    });
    $$('[data-tel]').forEach((a) => { a.href = 'tel:' + tel; });
    $$('[data-campo]').forEach((el) => { el.textContent = LOJA[el.dataset.campo] || ''; });
  }

  /* ---------- 16. rótulo dos botões -------------------------------------- */

  /* O botão "brilho" (CSS seção 3) precisa do texto dentro de um span, que é
     onde mora o brilho interno do hover. Em vez de escrever o span à mão em
     cada botão das 4 páginas, embrulha aqui; e um observador faz o mesmo nos
     botões que aparecem depois (estoque filtrado, painel da página do carro). */
  function vestir(b) {
    if (b.dataset.vestido) return;
    b.dataset.vestido = '1';
    const r = document.createElement('span');
    r.className = 'btn__rotulo';
    while (b.firstChild) r.appendChild(b.firstChild);
    b.appendChild(r);
  }
  function vestirBotoes() {
    $$('.btn').forEach(vestir);
    new MutationObserver((mudancas) => {
      for (const m of mudancas) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.classList.contains('btn')) vestir(n);
          n.querySelectorAll && n.querySelectorAll('.btn').forEach(vestir);
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 17. cookies e cliques no WhatsApp ------------------------ */

  /* Aviso de cookies (LGPD) e registro de cada clique no WhatsApp. Aqui é
     demonstração: o registro fica no localStorage deste navegador e o painel
     (painel.html) lê de lá, então o lojista clica no site e vê o clique
     chegar no painel. Num cliente de verdade isso vai para o banco/Analytics. */
  function cookiesECliques() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="wa.me"]');
      if (!a) return;
      const rotulo = a.closest('.topo') ? 'Topo do site' : a.closest('.zap-flutua') || a.id === 'zap-flutua' ? 'Botão flutuante'
        : a.id === 'sim-zap' ? 'Simulador' : a.closest('.painel-preco') ? 'Página do carro'
        : a.closest('#vitrine') ? 'Vitrine da home' : 'Botão do site';
      let lista = [];
      try { lista = JSON.parse(localStorage.getItem('pa-cliques')) || []; } catch (x) { /* sem armazenamento */ }
      lista.push({ quando: Date.now(), rotulo, pagina: document.title.split('|')[0].trim() });
      try { localStorage.setItem('pa-cliques', JSON.stringify(lista.slice(-50))); } catch (x) { /* segue */ }
    });

    let escolha = null;
    try { escolha = localStorage.getItem('pa-consentimento'); } catch (x) { /* aba anônima */ }
    if (escolha || gravando || document.body.dataset.numeroZap) return;
    const caixa = document.createElement('div');
    caixa.className = 'cookies';
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-label', 'Aviso de cookies');
    caixa.innerHTML = '<p><b>Cookies</b> Usamos cookies para medir as visitas e melhorar o site. Você escolhe.</p>' +
      '<div><button type="button" data-c="essenciais">Só os essenciais</button><button type="button" data-c="todos">Aceitar</button></div>';
    document.body.appendChild(caixa);
    setTimeout(() => caixa.classList.add('mostra'), 1600);
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      try { localStorage.setItem('pa-consentimento', b.dataset.c); } catch (x) { /* segue */ }
      caixa.classList.remove('mostra'); setTimeout(() => caixa.remove(), 500);
    });
  }

  /* ---------- arranque --------------------------------------------------- */

  function iniciar() {
    vestirBotoes();
    rolagemSuave();
    videoHero();
    abertura();
    cabecalho();
    preencherContatos();
    montarHome();
    vitrine();
    vitrineEscura();
    tituloPorLinha();
    parallaxHero();
    parallax();
    revelar();
    contadores();
    simulador();
    zapFlutuante();
    cookiesECliques();
    if (typeof montarEstoque === 'function') montarEstoque();
    if (typeof montarVeiculo === 'function') montarVeiculo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();

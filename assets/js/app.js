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

   3. Quem pediu menos movimento no sistema não recebe vídeo,
      parallax, digitação nem rolagem suave. O site continua inteiro.

   4. Travar a página (menu, gaveta, lupa) passa SEMPRE por
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
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.95, anchors: { offset: document.querySelector('.faixa-demo') ? -110 : -84 } });
    const quadro = (t) => { lenis.raf(t); requestAnimationFrame(quadro); };
    requestAnimationFrame(quadro);
    if (document.body.classList.contains('travado')) lenis.stop();
  }

  /* ---------- 1. entrada ------------------------------------------------- */

  /* html.acendeu é o gatilho da entrada do título, do texto e dos botões (ver
     o CSS do hero). Sem abertura desde 18/11/2026: liga logo no início. */
  const acender = () => {
    if (document.documentElement.classList.contains('acendeu')) return;
    document.documentElement.classList.add('acendeu');
    document.dispatchEvent(new Event('pa:acendeu'));
  };

  /* ---------- 2. vídeo do hero ------------------------------------------- */

  /* Toca UMA vez (~7 s, o close no farol) e para no último quadro, que é a
     mesma imagem da foto de reserva. 1440p em monitor grande ou retina, 1080p
     no notebook, 720p no celular. Quem pediu menos movimento ou está com
     economia de dados nem baixa: fica a foto. Se o vídeo não começar em 4 s
     (autoplay bloqueado, rede lenta), a foto aparece no lugar. */
  function videoHero() {
    const v = $('.hero__video');
    if (!v) return;
    const hero = v.closest('.hero');
    const mostrarFoto = () => { if (!v.classList.contains('tocando')) hero.classList.add('hero--foto'); };
    const economia = navigator.connection && navigator.connection.saveData;
    if (paradoQuieto || economia) { v.remove(); hero.classList.add('hero--foto'); return; }

    const px = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1);
    const base = v.dataset.video + (innerWidth < 760 ? '-720' : px >= 2200 ? '-1440' : '-1080');
    v.muted = true;
    v.playsInline = true;
    v.innerHTML = '<source src="' + base + '.webm" type="video/webm"><source src="' + base + '.mp4" type="video/mp4">';
    v.preload = 'auto';
    v.load();

    const reserva = setTimeout(mostrarFoto, 4000);
    v.addEventListener('playing', () => { clearTimeout(reserva); v.classList.add('tocando'); }, { once: true });
    v.addEventListener('error', mostrarFoto, { once: true });
    // terminou: fica parado no último quadro, e a foto (o mesmo quadro) assume
    // por baixo, para nada piscar se o navegador descartar o vídeo
    v.addEventListener('ended', () => hero.classList.add('hero--fim'), { once: true });

    let visivel = true;
    const tocar = () => {
      if (!visivel || v.ended) return;
      const p = v.play();
      if (p && p.catch) p.catch(mostrarFoto);
    };
    tocar();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (visivel) tocar(); else if (!v.ended) v.pause();
      }).observe(hero);
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

  /* ---------- 10. grade de estoque da home (modelo Belloni / Webmotors) -- */

  /* 8 carros: os de destaque primeiro, depois os mais novos. Cartão de loja:
     foto, selo do ano, nome, ano e km, preço e "Ver detalhes". O cartão
     inteiro é link. Carro vendido não entra (o ESTOQUE já vem com o que o
     painel salvou). */
  function cartaoLoja(c) {
    const preco = c.preco ? fmtPreco(c.preco) : 'Sob consulta';
    return `
      <article class="loja-card">
        <div class="loja-card__foto">
          <img src="${c.foto}" alt="${c.marca} ${c.modelo} ${c.versao}, ${c.ano}" loading="lazy" width="800" height="600">
          <span class="loja-card__ano">${c.anoModelo || c.ano}</span>
          ${c.selo ? `<span class="loja-card__selo">${c.selo}</span>` : ''}
        </div>
        <div class="loja-card__corpo">
          <p class="loja-card__marca">${c.marca}</p>
          <h3 class="loja-card__nome">${c.modelo} ${c.versao}</h3>
          <p class="loja-card__info">${c.ano}/${c.anoModelo}<i></i>${fmtKm(c.km)}<i></i>${c.cambio}</p>
          <div class="loja-card__pe">
            <b>${preco}</b>
            <span>Ver detalhes ${ico('chevron-right')}</span>
          </div>
        </div>
        <a class="carro__link" href="veiculo.html?id=${c.id}">
          <span class="visualmente-oculto">Ver ${c.marca} ${c.modelo} ${c.versao}</span>
        </a>
      </article>`;
  }

  function gradeHome() {
    const raiz = $('#grade-home');
    if (!raiz) return;
    // o ESTOQUE já chega sem os vendidos e excluídos (dados.js aplica o painel)
    const lista = ESTOQUE
      .filter((c) => c.home !== false)
      .sort((a, b) => (b.destaque === true) - (a.destaque === true) || b.anoModelo - a.anoModelo || b.preco - a.preco)
      .slice(0, 8);
    raiz.innerHTML = lista.map(cartaoLoja).join('');
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
    // na página do carro (data-carro="url") o simulador fica preso ao carro do ?id=
    const idFixo = raiz.dataset.carro === 'url' ? new URLSearchParams(location.search).get('id') : raiz.dataset.carro;
    const carroFixo = idFixo ? carroPorId(idFixo) : null;

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
    const inicial = carroFixo || carroPorId('compass-longitude-2021') || ESTOQUE[0];
    if (carroFixo) {
      const campo = selCarro.closest('.campo');
      campo.hidden = true;
      // no lugar do seletor, o carro que está sendo simulado
      campo.insertAdjacentHTML('beforebegin', `
        <div class="sim-fixo">
          <img src="${carroFixo.foto}" alt="" width="800" height="600" loading="lazy">
          <div>
            <small>Simulando</small>
            <b>${carroFixo.marca} ${carroFixo.modelo}</b>
            <span>${carroFixo.versao} · ${fmtPreco(carroFixo.preco)}</span>
          </div>
        </div>`);
    }
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
    const marcar = () => btn.classList.toggle('mostra', window.scrollY > window.innerHeight * 0.95);
    marcar();
    aoRolar(marcar);
  }

  /* ---------- 14. conteúdo montado a partir de dados.js ------------------ */

  function montarHome() {
    const entregas = $('#entregas');
    if (entregas) {
      entregas.innerHTML = ENTREGAS.map((e, i) => `
        <figure class="entrega rev rev--d${(i % 4) + 1}">
          <div class="entrega__foto">
            <img src="${e.foto}" alt="${e.nome} na entrega do ${e.carro}" loading="lazy" width="720" height="900">
          </div>
          <div class="entrega__texto">
            <div class="entrega__topo">
              <span class="estrelas" aria-label="5 de 5 estrelas">
                ${ico('star').replace('class="icone"', 'class="icone icone--cheio"').repeat(5)}
              </span>
              <small>${e.quando || ''}</small>
            </div>
            <blockquote><p>${e.texto}</p></blockquote>
            <figcaption>
              <strong>${e.nome}</strong>
              <small>Levou o ${e.carro}</small>
            </figcaption>
          </div>
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

  /* ---------- 17. cliques no WhatsApp ----------------------------------- */

  /* Registro de cada clique no WhatsApp. O aviso de cookies saiu em
     18/11/2026 (loja fictícia), e o de demonstração virou a faixa fixa do topo
     (.faixa-demo, no HTML). Aqui é demonstração: o registro fica no localStorage deste navegador e o painel
     (painel.html) lê de lá, então o lojista clica no site e vê o clique
     chegar no painel. Num cliente de verdade isso vai para o banco/Analytics. */
  function cliquesNoZap() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="wa.me"]');
      if (!a) return;
      const rotulo = a.closest('.topo') ? 'Topo do site' : a.closest('.zap-flutua') || a.id === 'zap-flutua' ? 'Botão flutuante'
        : a.id === 'sim-zap' ? 'Simulador' : a.closest('.painel-preco') ? 'Página do carro'
        : a.closest('#estoque-secao') ? 'Estoque da home' : 'Botão do site';
      let lista = [];
      try { lista = JSON.parse(localStorage.getItem('pa-cliques')) || []; } catch (x) { /* sem armazenamento */ }
      lista.push({ quando: Date.now(), rotulo, pagina: document.title.split('|')[0].trim() });
      try { localStorage.setItem('pa-cliques', JSON.stringify(lista.slice(-50))); } catch (x) { /* segue */ }
    });
  }

  /* ---------- 18. convite para o painel no fim da home ------------------ */

  /* Pedido dele (18/11/2026): quem chega ao fim da página inicial recebe um
     cartão chamando para o painel do vendedor (entrar.html). Aparece uma vez
     por visita (sessionStorage) e fecha no X. Fica à esquerda, longe do
     WhatsApp flutuante. */
  function conviteAoPainel() {
    const rodape = $('.rodape');
    if (!rodape || !$('#estoque-secao') || gravando || !('IntersectionObserver' in window)) return;
    let viu = false;
    try { viu = sessionStorage.getItem('pa-convite-painel') === '1'; } catch (x) { /* aba anônima */ }
    if (viu) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      try { sessionStorage.setItem('pa-convite-painel', '1'); } catch (x) { /* segue */ }
      const caixa = document.createElement('aside');
      caixa.className = 'convite-painel';
      caixa.setAttribute('aria-label', 'Convite para o painel do vendedor');
      caixa.innerHTML = `
        <button class="convite-painel__fechar" type="button" aria-label="Fechar">${ico('x')}</button>
        <span class="convite-painel__icone">${ico('layout-dashboard')}</span>
        <div>
          <p class="convite-painel__titulo"><span class="ponto-vivo" aria-hidden="true"></span>Agora veja o outro lado</p>
          <p>Você viu o site que o cliente vê. No painel do vendedor dá para mexer no estoque e ver os contatos e as visitas chegando.</p>
          <a class="btn convite-painel__btn" href="entrar.html">${ico('log-in')} Entrar no painel</a>
        </div>`;
      document.body.appendChild(caixa);   // o observador do vestirBotoes() já embrulha o botão
      requestAnimationFrame(() => requestAnimationFrame(() => caixa.classList.add('mostra')));
      $('.convite-painel__fechar', caixa).addEventListener('click', () => {
        caixa.classList.remove('mostra'); setTimeout(() => caixa.remove(), 600);
      });
    }, { threshold: 0.15 });
    obs.observe(rodape);
  }

  /* ---------- arranque --------------------------------------------------- */

  function iniciar() {
    vestirBotoes();
    rolagemSuave();
    videoHero();
    acender();
    cabecalho();
    preencherContatos();
    montarHome();
    gradeHome();
    tituloPorLinha();
    parallaxHero();
    parallax();
    revelar();
    contadores();
    simulador();
    zapFlutuante();
    cliquesNoZap();
    conviteAoPainel();
    if (typeof montarEstoque === 'function') montarEstoque();
    if (typeof montarVeiculo === 'function') montarVeiculo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();

/* ==========================================================================
   ponto AUTO, filtro do estoque
   --------------------------------------------------------------------------
   Filtra em memória a partir do array de dados.js. Nenhuma requisição, nada
   de recarregar a página: o usuário mexe num filtro e a grade responde.

   Os filtros escolhidos viram parâmetros na URL. Assim o vendedor consegue
   mandar um link já filtrado no WhatsApp ("olha os SUV até 200 mil") e a
   busca rápida do hero da home cai direto aqui com tudo aplicado.
   ========================================================================== */

function montarEstoque() {
  const grade = document.getElementById('grade-estoque');
  if (!grade) return;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const conta = $('#conta-resultado');
  const ordenar = $('#ordenar');
  const texto = $('#filtro-texto');
  const teto = $('#filtro-teto');
  const tetoRotulo = $('#filtro-teto-valor');
  const limpar = $('#limpa-filtros');

  const PRECO_MAX = Math.ceil(Math.max(...ESTOQUE.map((c) => c.preco)) / 10000) * 10000;

  /* ---------- monta os filtros a partir do próprio estoque -------------- */

  const unicos = (campo) => Array.from(new Set(ESTOQUE.map((c) => c[campo]))).sort();

  function chips(destino, campo, lista) {
    const caixa = $(destino);
    if (!caixa) return;
    caixa.innerHTML = lista.map((v) =>
      `<button class="chip" type="button" data-filtro="${campo}" data-valor="${v}" aria-pressed="false">${v}</button>`
    ).join('');
  }

  function checks(destino, campo, lista) {
    const caixa = $(destino);
    if (!caixa) return;
    caixa.innerHTML = lista.map((v) => {
      const quantos = ESTOQUE.filter((c) => c[campo] === v).length;
      return `<label class="check">
        <input type="checkbox" data-filtro="${campo}" value="${v}">
        <span>${v}</span>
        <span style="margin-left:auto;font-size:.78rem;opacity:.6">${quantos}</span>
      </label>`;
    }).join('');
  }

  chips('#filtro-carroceria', 'carroceria', unicos('carroceria'));
  checks('#filtro-marca', 'marca', unicos('marca'));
  checks('#filtro-cambio', 'cambio', unicos('cambio'));
  checks('#filtro-combustivel', 'combustivel', unicos('combustivel'));

  teto.min = 50000;
  teto.max = PRECO_MAX;
  teto.step = 5000;
  teto.value = PRECO_MAX;
  $('#teto-min').textContent = fmtPreco(50000);
  $('#teto-max').textContent = fmtPreco(PRECO_MAX);

  /* ---------- estado ----------------------------------------------------- */

  const estado = {
    texto: '', carroceria: '', marca: [], cambio: [], combustivel: [],
    ate: PRECO_MAX, ordem: 'relevancia'
  };

  /* lê o que veio da URL (link do WhatsApp ou busca rápida do hero) */
  const url = new URLSearchParams(location.search);
  if (url.get('carroceria')) estado.carroceria = url.get('carroceria');
  if (url.get('marca')) estado.marca = [url.get('marca')];
  if (url.get('ate')) estado.ate = Math.min(Number(url.get('ate')), PRECO_MAX);
  if (url.get('q')) estado.texto = url.get('q');

  function refletirNaTela() {
    texto.value = estado.texto;
    teto.value = estado.ate;
    tetoRotulo.textContent = estado.ate >= PRECO_MAX ? 'Qualquer valor' : 'Até ' + fmtPreco(estado.ate);
    $$('[data-filtro="carroceria"]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.valor === estado.carroceria)));
    $$('input[data-filtro]').forEach((i) => {
      i.checked = estado[i.dataset.filtro].includes(i.value);
    });
  }

  /* ---------- filtragem -------------------------------------------------- */

  function filtrar() {
    const busca = estado.texto.trim().toLowerCase();
    let lista = ESTOQUE.filter((c) => {
      if (estado.carroceria && c.carroceria !== estado.carroceria) return false;
      if (estado.marca.length && !estado.marca.includes(c.marca)) return false;
      if (estado.cambio.length && !estado.cambio.includes(c.cambio)) return false;
      if (estado.combustivel.length && !estado.combustivel.includes(c.combustivel)) return false;
      if (c.preco > estado.ate) return false;
      if (busca) {
        const alvo = `${c.marca} ${c.modelo} ${c.versao} ${c.cor} ${c.ano}`.toLowerCase();
        if (!busca.split(/\s+/).every((t) => alvo.includes(t))) return false;
      }
      return true;
    });

    const ordens = {
      'preco-asc': (a, b) => a.preco - b.preco,
      'preco-desc': (a, b) => b.preco - a.preco,
      'km-asc': (a, b) => a.km - b.km,
      'ano-desc': (a, b) => b.ano - a.ano,
      'relevancia': (a, b) => (b.destaque - a.destaque) || (a.preco - b.preco)
    };
    lista.sort(ordens[estado.ordem] || ordens.relevancia);

    grade.innerHTML = lista.length
      ? lista.map((c, n) => cartaoCarro(c).replace('<article class="carro ', '<article style="--i:' + n + '" class="carro ')).join('')
      : `<div class="vazio">
           ${ico('circle-alert')}
           <h3 style="margin-bottom:.5rem">Nenhum carro com esses filtros</h3>
           <p>Solta um filtro ou chama a gente no WhatsApp. Chega carro novo toda semana
              e muita coisa sai antes de entrar no site.</p>
           <p style="margin-top:1.2rem">
             <a class="btn btn--zap" href="${linkZap('Olá! Não achei o que procuro no site. Vocês têm previsão de entrada de algum carro?')}">
               ${ico('whatsapp').replace('class="icone"', 'class="icone icone--cheio"')}
               Perguntar no WhatsApp
             </a>
           </p>
         </div>`;

    conta.innerHTML = lista.length === 1
      ? '<b>1</b> carro encontrado'
      : `<b>${lista.length}</b> carros encontrados`;

    gravarNaUrl();
  }

  function gravarNaUrl() {
    const p = new URLSearchParams();
    if (estado.carroceria) p.set('carroceria', estado.carroceria);
    if (estado.marca.length === 1) p.set('marca', estado.marca[0]);
    if (estado.ate < PRECO_MAX) p.set('ate', estado.ate);
    if (estado.texto) p.set('q', estado.texto);
    const nova = location.pathname + (p.toString() ? '?' + p : '');
    history.replaceState(null, '', nova);
  }

  /* ---------- eventos ---------------------------------------------------- */

  document.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-filtro="carroceria"]');
    if (!chip) return;
    estado.carroceria = estado.carroceria === chip.dataset.valor ? '' : chip.dataset.valor;
    refletirNaTela();
    filtrar();
  });

  document.addEventListener('change', (ev) => {
    const cx = ev.target.closest('input[type="checkbox"][data-filtro]');
    if (!cx) return;
    const campo = cx.dataset.filtro;
    estado[campo] = cx.checked
      ? estado[campo].concat(cx.value)
      : estado[campo].filter((v) => v !== cx.value);
    filtrar();
  });

  let esperando;
  texto.addEventListener('input', () => {
    clearTimeout(esperando);
    esperando = setTimeout(() => { estado.texto = texto.value; filtrar(); }, 220);
  });

  teto.addEventListener('input', () => {
    estado.ate = Number(teto.value);
    tetoRotulo.textContent = estado.ate >= PRECO_MAX ? 'Qualquer valor' : 'Até ' + fmtPreco(estado.ate);
    filtrar();
  });

  ordenar.addEventListener('change', () => { estado.ordem = ordenar.value; filtrar(); });

  limpar.addEventListener('click', () => {
    estado.texto = ''; estado.carroceria = '';
    estado.marca = []; estado.cambio = []; estado.combustivel = [];
    estado.ate = PRECO_MAX;
    refletirNaTela();
    filtrar();
  });

  /* ---------- gaveta de filtros no celular ------------------------------ */

  /* No celular a gaveta fechada fica fora da tela, mas os campos dela ainda
     recebiam Tab. `inert` resolve. No desktop ela é a coluna lateral e nunca
     fica inerte. */
  const gaveta = $('#filtros');
  const veu = $('#veu');
  const celular = window.matchMedia('(max-width: 999px)');
  const sincronizarInerte = () => { gaveta.inert = celular.matches && !gaveta.classList.contains('aberta'); };
  celular.addEventListener?.('change', sincronizarInerte);
  const abreGaveta = () => {
    gaveta.classList.add('aberta'); veu.classList.add('mostra');
    window.pontoAuto.travar(); sincronizarInerte();
    setTimeout(() => $('#filtro-texto')?.focus({ preventScroll: true }), 350);
  };
  const fechaGaveta = () => {
    $('#abre-filtros')?.focus({ preventScroll: true });
    gaveta.classList.remove('aberta'); veu.classList.remove('mostra');
    window.pontoAuto.destravar(); sincronizarInerte();
  };
  sincronizarInerte();
  $('#abre-filtros')?.addEventListener('click', abreGaveta);
  $('#fecha-filtros')?.addEventListener('click', fechaGaveta);
  $('#aplica-filtros')?.addEventListener('click', fechaGaveta);
  veu?.addEventListener('click', fechaGaveta);

  refletirNaTela();
  filtrar();
}

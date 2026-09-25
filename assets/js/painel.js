/* ==========================================================================
   ponto AUTO, painel da loja (demonstração)
   --------------------------------------------------------------------------
   Tudo aqui é FICTÍCIO e gerado com semente fixa, então os números são os
   mesmos toda vez e batem entre as telas (a meta de vendas da visão geral é a
   mesma das Metas, os cliques do funil são os mesmos dos Visitantes...).

   Duas coisas são de verdade, para impressionar na demonstração:
   - O estoque vem do mesmo dados.js do site: carro cadastrado aqui aparece na
     tabela; carro do site aparece aqui com foto e preço.
   - Clique no WhatsApp feito no site (neste navegador) entra no painel ao vivo
     (localStorage 'pa-cliques', gravado pelo app.js do site). Com o site
     aberto em outra aba, o clique aparece aqui na hora.

   O que o lojista mexe (cadastro, situação do carro, agenda, rotina, etapa do
   lead) fica salvo neste navegador (localStorage), para a demonstração não
   "esquecer" quando ele recarrega. Num cliente de verdade isso vai para o banco.

   Gráficos: Chart.js, cores da paleta validada do guia de dataviz (azul,
   laranja, água, sempre nessa ordem), uma escala por gráfico, rótulos em cor
   de texto, grade discreta.
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s, e = document) => e.querySelector(s);
  const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
  const ico = (n, cheio) => `<svg class="icone${cheio ? ' icone--cheio' : ''}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const nf = (v) => Math.round(v).toLocaleString('pt-BR');
  const brl = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const brlMi = (v) => 'R$ ' + (v / 1e6).toFixed(2).replace('.', ',') + ' mi';
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* aba anônima */ } };
  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } };

  /* ---------- números fictícios, sempre os mesmos ------------------------ */
  function semente(n) { return () => { n = (n * 1664525 + 1013904223) % 4294967296; return n / 4294967296; }; }
  const rnd = semente(20260925);
  const entre = (a, b) => a + (b - a) * rnd();
  const inteiro = (a, b) => Math.floor(entre(a, b + 1));

  const HOJE = new Date(); HOJE.setHours(0, 0, 0, 0);
  const DIA = 86400000;
  const dataISO = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  // visitas por dia, 180 dias: sobe devagar, sábado é o pico, domingo cai
  const SERIE = [];
  for (let i = 179; i >= 0; i--) {
    const d = new Date(HOJE.getTime() - i * DIA);
    const dia = d.getDay();
    const peso = [0.72, 1.0, 0.95, 0.97, 1.02, 1.12, 1.28][dia];
    const tendencia = 1 + (180 - i) * 0.0022;
    const visitas = Math.round(430 * peso * tendencia * entre(0.88, 1.12));
    const cliques = Math.round(visitas * entre(0.058, 0.082));
    SERIE.push({ d, visitas, cliques });
  }
  const soma = (dias, campo, desloca = 0) => SERIE.slice(SERIE.length - dias - desloca, SERIE.length - desloca).reduce((s, x) => s + x[campo], 0);

  /* ---------- equipe e permissões ------------------------------------
     Todo mundo tem a própria agenda e o próprio quadro de leads. O resto é
     permissão que o administrador liga e desliga por pessoa, em "Equipe e
     acessos". "Ver como" (no topo) mostra o painel pelos olhos de cada um. */
  const PERMISSOES = [
    { grupo: 'Estoque', icone: 'car-front', itens: [
      ['estoque.ver', 'Ver o estoque', 'Preços, fotos e situação de cada carro'],
      ['estoque.editar', 'Cadastrar e editar veículos', 'Preço, dados, fotos e situação'],
      ['estoque.excluir', 'Excluir veículos', 'Tirar um carro do sistema de vez']] },
    { grupo: 'Agenda', icone: 'calendar-days', fixo: 'A própria agenda e rotina', itens: [
      ['agenda.todos', 'Ver e editar a agenda de todos', 'Sem isso, vê só os próprios compromissos']] },
    { grupo: 'Leads', icone: 'message-circle', fixo: 'O próprio quadro de leads', itens: [
      ['leads.todos', 'Ver e redistribuir leads de todos', 'Sem isso, vê só os leads dele']] },
    { grupo: 'Resultados', icone: 'chart-column', itens: [
      ['site.ver', 'Visitantes do site', 'Cookies, cidades e cliques no WhatsApp'],
      ['metas.ver', 'Metas e faturamento', 'Vendas, faturamento e ranking']] },
    { grupo: 'Administração', icone: 'settings', itens: [
      ['equipe.gerenciar', 'Gerenciar equipe e acessos', 'Convidar pessoas e mudar permissões']] }
  ];
  const TODAS = PERMISSOES.flatMap((g) => g.itens.map((i) => i[0]));
  const ROTULO_PERM = Object.fromEntries(PERMISSOES.flatMap((g) => g.itens.map((i) => [i[0], i[1]])));
  const PERFIS = {
    'Administrador': TODAS,
    'Gerente de vendas': ['estoque.ver', 'estoque.editar', 'agenda.todos', 'leads.todos', 'site.ver', 'metas.ver'],
    'Vendedor': ['estoque.ver'],
    'Estoque e fotos': ['estoque.ver', 'estoque.editar'],
    'Financeiro': ['estoque.ver', 'site.ver', 'metas.ver']
  };
  const EQUIPE_BASE = [
    { id: 'carlos', nome: 'Carlos Menezes', funcao: 'Dono e gerente', perfil: 'Administrador', vendas: 8 },
    { id: 'fernanda', nome: 'Fernanda Rocha', funcao: 'Consultora de vendas', perfil: 'Gerente de vendas', vendas: 7 },
    { id: 'ricardo', nome: 'Ricardo Alves', funcao: 'Consultor de vendas', perfil: 'Vendedor', vendas: 5 },
    { id: 'juliana', nome: 'Juliana Prado', funcao: 'Consultora de vendas', perfil: 'Vendedor', vendas: 3 },
    { id: 'thiago', nome: 'Thiago Lima', funcao: 'Fotos e anúncios', perfil: 'Estoque e fotos', vendas: 0 },
    { id: 'patricia', nome: 'Patrícia Souza', funcao: 'Financeiro', perfil: 'Financeiro', vendas: 0 }
  ];
  const primeiro = (n) => String(n || '').split(' ')[0];
  const iniciais = (n) => String(n || '?').split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  const EQUIPE = ler('pa-painel-equipe', null) || EQUIPE_BASE.map((p) => Object.assign({
    email: primeiro(p.nome).toLowerCase() + '@pontoauto.com.br', perms: PERFIS[p.perfil].slice(), ativo: true
  }, p));
  const salvarEquipe = () => guardar('pa-painel-equipe', EQUIPE);
  let eu = EQUIPE.find((p) => p.id === ler('pa-painel-eu', 'carlos') && p.ativo) || EQUIPE[0];
  const pode = (k) => eu.perms.includes(k);
  const VENDEDORES = EQUIPE;
  const QUEM_VENDE = () => EQUIPE.filter((p) => p.ativo && (p.vendas || /vend/i.test(p.funcao) || p.perfil === 'Vendedor'));

  const META = { vendas: 30, faturamento: 5000000, leads: 350, giro: 45 };
  const VENDAS_MES = EQUIPE_BASE.reduce((s, v) => s + v.vendas, 0);   // 23
  const FATURAMENTO = 3942700;
  // 12 meses de vendas, terminando no mês atual (que ainda está correndo)
  const VENDAS_ANO = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(HOJE.getFullYear(), HOJE.getMonth() - i, 1);
    VENDAS_ANO.push({ rotulo: MES_CURTO[d.getMonth()], vendas: i === 0 ? VENDAS_MES : inteiro(19, 33), meta: i < 4 ? 30 : 26 });
  }

  /* ---------- estoque: o do site + o cadastrado aqui, com as edições ----- */
  const numeroDe = (id) => String(id).split('').reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 100000, 7);
  let extras = ler('pa-painel-carros', []);
  const situacoes = ler('pa-painel-situacao', { 'fusion-sel-2017': 'Reservado' });
  const edicoes = ler('pa-painel-edicoes', {});
  const removidos = ler('pa-painel-removidos', []);
  const montarCarro = (c) => {
    const r = semente(numeroDe(c.id));
    const popular = c.preco < 160000 ? 1.35 : c.preco > 350000 ? 1.25 : 1;
    const visitas = c.extra ? 0 : Math.round((620 + r() * 1400) * popular);
    return Object.assign({}, c, edicoes[c.id] || {}, {
      situacao: situacoes[c.id] || 'Disponível',
      diasPatio: c.extra ? Math.max(0, Math.round((Date.now() - (c.criado || Date.now())) / DIA)) : Math.round(4 + r() * 88),
      visitas,
      cliques: Math.round(visitas * (0.05 + r() * 0.05))
    });
  };
  let estoque = ESTOQUE_BASE.concat(extras).filter((c) => !removidos.includes(c.id)).map(montarCarro);
  const mostrarEl = (el, sim) => { if (el) el.style.display = sim ? '' : 'none'; };

  /* ---------- cliques de verdade vindos do site ------------------------- */
  const cliquesReais = () => ler('pa-cliques', []);

  /* ==========================================================================
     NAVEGAÇÃO
     ========================================================================== */
  const iniciadas = new Set();
  function mostrar(tela) {
    if (!$('#tela-' + tela)) tela = 'visao';
    if (PERM_TELA[tela] && !pode(PERM_TELA[tela])) { avisar(primeiro(eu.nome) + ' não tem acesso a essa área. Libere em Equipe e acessos.'); tela = 'visao'; history.replaceState(null, '', '#visao'); }
    $$('.tela').forEach((t) => t.classList.toggle('ativa', t.dataset.tela === tela));
    $$('.nav a').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + tela ? 'page' : 'false'));
    fecharLateral();
    window.scrollTo({ top: 0 });
    if (!iniciadas.has(tela)) { iniciadas.add(tela); (TELAS[tela] || (() => {}))(); }
  }
  window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));

  const lateral = $('#lateral'), veu = $('#veu');
  function fecharLateral() { lateral.classList.remove('aberta'); veu.classList.remove('mostra'); }
  $('#abre-lateral').addEventListener('click', () => { lateral.classList.add('aberta'); veu.classList.add('mostra'); });
  veu.addEventListener('click', fecharLateral);

  const aviso = $('#aviso');
  let tAviso;
  function avisar(txt) {
    $('span', aviso).textContent = txt;
    aviso.classList.add('mostra');
    clearTimeout(tAviso); tAviso = setTimeout(() => aviso.classList.remove('mostra'), 3200);
  }
  $('#sino').addEventListener('click', () => avisar('3 leads novos hoje e 2 test drives agendados para amanhã.'));

  $('#busca-geral').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    location.hash = '#estoque';
    setTimeout(() => { $('#est-busca').value = e.target.value; $('#est-busca').dispatchEvent(new Event('input')); }, 60);
  });

  /* ==========================================================================
     GRÁFICOS (Chart.js no padrão do guia)
     ========================================================================== */
  const graficos = {};
  function baseGrafico() {
    if (!window.Chart) return null;
    Chart.defaults.font.family = css('--fonte');
    Chart.defaults.font.size = 11.5;
    Chart.defaults.color = css('--texto-3');
    return {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1017', titleColor: '#fff', bodyColor: 'rgba(255,255,255,.85)',
          padding: 10, cornerRadius: 8, displayColors: true, boxWidth: 8, boxHeight: 8, boxPadding: 4,
          titleFont: { weight: '700' }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: css('--linha') }, ticks: { maxRotation: 0, autoSkipPadding: 14 } },
        y: { beginAtZero: true, grid: { color: css('--linha-2') }, border: { display: false }, ticks: { padding: 6, callback: (v) => nf(v) } }
      }
    };
  }
  function grafico(id, cfg) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) { if (el) el.parentElement.innerHTML = '<p class="vazio">Gráfico precisa de internet para carregar.</p>'; return null; }
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart(el, cfg);
    return graficos[id];
  }
  function linha(id, rotulos, dados, nome, cor = css('--s1')) {
    const o = baseGrafico(); if (!o) return grafico(id);
    return grafico(id, {
      type: 'line',
      data: { labels: rotulos, datasets: [{ label: nome, data: dados, borderColor: cor, borderWidth: 2, tension: .35, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: cor, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, fill: true,
        backgroundColor: (ctx) => { const { chart } = ctx; if (!chart.chartArea) return 'transparent'; const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom); g.addColorStop(0, cor + '33'); g.addColorStop(1, cor + '00'); return g; } }] },
      options: o
    });
  }
  function barrasComMeta(id) {
    const o = baseGrafico(); if (!o) return grafico(id);
    o.interaction = { mode: 'index', intersect: false };
    return grafico(id, {
      data: {
        labels: VENDAS_ANO.map((m) => m.rotulo),
        datasets: [
          { type: 'bar', label: 'Vendidos', data: VENDAS_ANO.map((m) => m.vendas), backgroundColor: VENDAS_ANO.map((m, i) => i === 11 ? css('--s1') : css('--s1') + 'b3'), borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 28, order: 2 },
          { type: 'line', label: 'Meta', data: VENDAS_ANO.map((m) => m.meta), borderColor: css('--texto-2'), borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, stepped: 'middle', order: 1 }
        ]
      },
      options: o
    });
  }

  /* ==========================================================================
     TELAS
     ========================================================================== */
  const TIPOS_EVENTO = {
    'Test drive': '--s1', 'Visita': '--s3', 'Entrega': '--s2', 'Vistoria': '--s4', 'Reunião': '--s5'
  };

  // ---------- agenda fictícia do mês anterior ao seguinte ----------------
  const CLIENTES = ['Paulo Henrique', 'Mariana Costa', 'Rafael Dias', 'Beatriz Lopes', 'André Martins', 'Camila Freitas', 'Lucas Ribeiro', 'Renata Gomes', 'Gustavo Nunes', 'Aline Barbosa', 'Diego Moreira', 'Vanessa Castro'];
  function eventosBase() {
    const r = semente(777);
    const lista = [];
    const ini = new Date(HOJE.getFullYear(), HOJE.getMonth() - 1, 1);
    const fim = new Date(HOJE.getFullYear(), HOJE.getMonth() + 2, 0);
    for (let d = new Date(ini); d <= fim; d = new Date(d.getTime() + DIA)) {
      const dia = d.getDay();
      if (dia === 0) continue;
      const n = dia === 6 ? 3 : Math.floor(r() * 3) + 1;
      for (let k = 0; k < n; k++) {
        const tipos = Object.keys(TIPOS_EVENTO);
        const tipo = dia === 1 && k === 0 ? 'Reunião' : tipos[Math.floor(r() * 4)];
        const carro = ESTOQUE_BASE[Math.floor(r() * ESTOQUE_BASE.length)];
        const cliente = CLIENTES[Math.floor(r() * CLIENTES.length)];
        const hora = tipo === 'Reunião' ? '08:30' : String(9 + Math.floor(r() * 8)).padStart(2, '0') + (r() > .5 ? ':30' : ':00');
        const quem = primeiro(EQUIPE_BASE[Math.floor(r() * 4)].nome);
        const titulo = tipo === 'Reunião' ? 'Reunião de metas da semana'
          : tipo === 'Vistoria' ? `Vistoria de entrada: ${carro.modelo}`
          : `${tipo}: ${carro.modelo} (${primeiro(cliente)})`;
        lista.push({ id: 'b' + lista.length, data: dataISO(d), hora, tipo, titulo, quem, obs: tipo === 'Reunião' ? 'Toda a equipe' : cliente });
      }
    }
    return lista;
  }
  let eventos = ler('pa-painel-agenda', null) || eventosBase().concat(ler('pa-painel-eventos', []));
  const salvarAgenda = () => guardar('pa-painel-agenda', eventos);
  // quem pode ver o quê: sem "agenda.todos", só os próprios (e as reuniões de equipe)
  const meuNome = () => primeiro(eu.nome);
  const visivelNaAgenda = (e, filtro) => {
    if (!pode('agenda.todos')) return e.quem === meuNome() || e.tipo === 'Reunião';
    return !filtro || filtro === 'todos' || e.quem === filtro || e.tipo === 'Reunião';
  };
  let filtroAgenda = 'todos';
  let abrirEvento = () => {};   // definida pela tela da agenda
  const eventosDo = (iso) => eventos.filter((e) => e.data === iso && visivelNaAgenda(e, filtroAgenda)).sort((a, b) => a.hora.localeCompare(b.hora));
  const itemEvento = (e) => `
    <button type="button" class="dia-item" data-ev="${e.id}" style="--cor:var(${TIPOS_EVENTO[e.tipo]})">
      <time>${e.hora}</time>
      <div><b>${e.titulo}</b><small>${e.tipo} · ${e.quem}${e.obs ? ' · ' + e.obs : ''}</small></div>
      <span class="pilula pilula--neutro">${ico('pencil')}Editar</span>
    </button>`;

  // ---------- leads ----------------------------------------------------
  const ETAPAS = ['Novo', 'Em conversa', 'Visita marcada', 'Proposta', 'Vendido'];
  const ORIGENS = ['WhatsApp do site', 'Simulador', 'Página do carro', 'Instagram', 'Google', 'Indicação', 'Loja (presencial)'];
  function leadsBase() {
    const r = semente(4242);
    return Array.from({ length: 17 }, (_, i) => {
      const c = ESTOQUE_BASE[Math.floor(r() * ESTOQUE_BASE.length)];
      return {
        id: 'l' + i, nome: CLIENTES[i % CLIENTES.length] + (i >= CLIENTES.length ? ' Jr.' : ''),
        telefone: '(31) 9' + String(8000 + Math.floor(r() * 1999)) + '-' + String(1000 + Math.floor(r() * 8999)),
        carroId: c.id, origem: ORIGENS[Math.floor(r() * 5)],
        etapa: ETAPAS[Math.min(4, Math.floor(r() * 5.2))],
        resp: primeiro(EQUIPE_BASE[Math.floor(r() * 4)].nome),
        temp: ['Quente', 'Morno', 'Frio'][Math.floor(r() * 3)],
        obs: '', criado: Date.now() - (Math.floor(r() * 96) + 1) * 3600000, auto: true
      };
    });
  }
  let leads = ler('pa-painel-leads2', null) || leadsBase();
  const salvarLeads = () => guardar('pa-painel-leads2', leads);
  const carroDoLead = (l) => estoque.find((c) => c.id === l.carroId) || ESTOQUE_BASE.find((c) => c.id === l.carroId);
  let filtroLeads = 'todos';
  const leadsVisiveis = () => leads.filter((l) => !pode('leads.todos') ? l.resp === meuNome() : (filtroLeads === 'todos' || l.resp === filtroLeads));

  /* ---------------------------------------------------------------------- */
  const TELAS = {

    /* ================================================== VISÃO GERAL */
    visao() {
      const h = new Date().getHours();
      $('#saudacao').textContent = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', ' + primeiro(eu.nome);
      $('#data-hoje').textContent = `${SEMANA[HOJE.getDay()]}, ${HOJE.getDate()} de ${MESES[HOJE.getMonth()]}. O site está no ar e recebendo visitas.`;

      let dias = 30;
      const pintarKpis = () => {
        const reais = cliquesReais().length;
        const v = soma(dias, 'visitas'), va = soma(dias, 'visitas', dias);
        const c = soma(dias, 'cliques') + reais, ca = soma(dias, 'cliques', dias);
        const leadsP = Math.round(c * 0.24), leadsA = Math.round(ca * 0.24);
        const varia = (a, b) => { const p = (a - b) / b * 100; return `<span class="kpi__var ${p >= 0 ? 'kpi__var--sobe' : 'kpi__var--desce'}">${ico(p >= 0 ? 'trending-up' : 'trending-down')}${p >= 0 ? '+' : ''}${p.toFixed(1).replace('.', ',')}%<small>vs. ${dias} dias antes</small></span>`; };
        $('#kpis').innerHTML = [
          ['globe', 'Visitantes no site', nf(v), varia(v, va)],
          ['whatsapp', 'Cliques no WhatsApp', nf(c), varia(c, ca)],
          ['message-circle', 'Leads novos', nf(leadsP), varia(leadsP, leadsA)],
          ['key-round', 'Vendas no mês', `${VENDAS_MES}<small style="font-size:.5em;color:var(--texto-3);font-weight:600"> / ${META.vendas}</small>`, `<div class="barra-meta"><i style="width:${VENDAS_MES / META.vendas * 100}%"></i></div>`],
          pode('metas.ver')
            ? ['banknote', 'Faturamento no mês', brlMi(FATURAMENTO), `<div class="barra-meta"><i style="width:${FATURAMENTO / META.faturamento * 100}%"></i></div>`]
            : ['calendar-days', 'Meus compromissos hoje', String(eventosDo(dataISO(HOJE)).length), '<span class="nota-rodape">Faturamento: só com permissão</span>']
        ].map(([i, r, val, extra]) => `<article class="cartao kpi"><span class="kpi__rotulo">${ico(i, i === 'whatsapp')}${r}</span><span class="kpi__valor">${val}</span>${extra}</article>`).join('');
        const serie = SERIE.slice(-dias);
        $('#sub-visitas').textContent = `Pessoas por dia, últimos ${dias} dias`;
        linha('g-visitas', serie.map((x) => x.d.getDate() + '/' + (x.d.getMonth() + 1)), serie.map((x) => x.visitas), 'Visitas');
      };
      $$('#tela-visao .periodo button').forEach((b) => b.addEventListener('click', () => {
        $$('#tela-visao .periodo button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        dias = Number(b.dataset.dias); pintarKpis();
      }));
      pintarKpis();

      // funil de 30 dias
      const v30 = soma(30, 'visitas'), c30 = soma(30, 'cliques') + cliquesReais().length;
      const etapas = [
        ['Visitaram o site', v30], ['Abriram um carro', Math.round(v30 * .46)], ['Chamaram no WhatsApp', c30],
        ['Foram até a loja', Math.round(c30 * .21)], ['Compraram', VENDAS_MES]
      ];
      $('#funil').innerHTML = etapas.map(([r, n], i) => `<li><span>${r}${i ? `<small>${(n / etapas[i - 1][1] * 100).toFixed(1).replace('.', ',')}% da etapa anterior</small>` : ''}</span>
        <span class="trilho"><i style="width:${Math.max(2, Math.sqrt(n / v30) * 100)}%;animation-delay:${i * 90}ms"></i></span><b>${nf(n)}</b></li>`).join('');

      // mais vistos
      const top = estoque.slice().sort((a, b) => b.visitas - a.visitas).slice(0, 5);
      $('#mais-vistos').innerHTML = top.map((c) => `<li><span class="mini-foto"><img src="${c.foto}" alt=""><span><b>${c.marca} ${c.modelo}</b></span></span>
        <span class="valor">${nf(c.visitas)}</span><span class="trilho"><i style="width:${c.visitas / top[0].visitas * 100}%"></i></span></li>`).join('');

      // agenda de hoje
      const hoje = eventosDo(dataISO(HOJE));
      $('#sub-hoje').textContent = hoje.length ? `${hoje.length} compromisso${hoje.length > 1 ? 's' : ''}` : 'Dia livre';
      $('#agenda-hoje').innerHTML = hoje.length ? hoje.map(itemEvento).join('') : '<p class="vazio">Nada marcado para hoje.</p>';

      $('#agenda-hoje').addEventListener('click', (e) => { const b = e.target.closest('[data-ev]'); if (b) { location.hash = '#agenda'; setTimeout(() => abrirEvento(b.dataset.ev), 80); } });
      if (pode('metas.ver')) barrasComMeta('g-vendas-visao');
      pintarFeed();
    },

    /* ================================================== ESTOQUE */
    estoque() {
      const corSit = { 'Disponível': 'pilula--bom', 'Reservado': 'pilula--alerta', 'Vendido': 'pilula--neutro' };
      const podeEditar = pode('estoque.editar');
      const pintarResumo = () => {
        const ativos = estoque.filter((c) => c.situacao !== 'Vendido');
        const parados = ativos.filter((c) => c.diasPatio > 60).length;
        const giro = Math.round(ativos.reduce((s, c) => s + c.diasPatio, 0) / Math.max(1, ativos.length));
        $('#kpis-estoque').innerHTML = [
          ['car-front', 'Carros no estoque', nf(ativos.length), `${estoque.filter((c) => c.situacao === 'Reservado').length} reservado(s)`],
          ['banknote', 'Valor em estoque', brlMi(ativos.reduce((s, c) => s + c.preco, 0)), 'Soma dos preços anunciados'],
          ['clock', 'Tempo médio no pátio', giro + ' dias', `Meta: até ${META.giro} dias`],
          ['circle-alert', 'Parados há mais de 60 dias', nf(parados), parados ? 'Vale rever preço ou foto' : 'Nenhum carro encalhado']
        ].map(([i, r, v, s]) => `<article class="cartao kpi"><span class="kpi__rotulo">${ico(i)}${r}</span><span class="kpi__valor">${v}</span><span class="nota-rodape">${s}</span></article>`).join('');
        $('#nav-estoque').textContent = ativos.length;
      };
      const pintarTabela = () => {
        const q = $('#est-busca').value.trim().toLowerCase(), sit = $('#est-status').value, tipo = $('#est-tipo').value;
        const lista = estoque.filter((c) => (!sit || c.situacao === sit) && (!tipo || c.carroceria === tipo) &&
          (!q || `${c.marca} ${c.modelo} ${c.versao}`.toLowerCase().includes(q)));
        $('#est-conta').textContent = `${lista.length} de ${estoque.length} veículos`;
        $('#tabela-estoque').innerHTML = lista.map((c) => `
          <tr>
            <td><div class="carro-celula"><img src="${c.foto}" alt=""><div><b>${c.marca} ${c.modelo}</b><small>${c.versao} · ${c.ano}/${c.anoModelo || c.ano}</small></div></div></td>
            <td class="num"><b>${brl(c.preco)}</b>${c.precoDe ? `<br><s class="nota-rodape">${brl(c.precoDe)}</s>` : ''}</td>
            <td class="num">${nf(c.km)}</td>
            <td class="num">${c.diasPatio > 60 ? `<span class="pilula pilula--alerta">${ico('clock')}${c.diasPatio} dias</span>` : c.diasPatio + ' dias'}</td>
            <td class="num">${nf(c.visitas)}</td>
            <td class="num">${nf(c.cliques)}</td>
            <td>${podeEditar ? `<select class="sel-status ${corSit[c.situacao]}" data-id="${c.id}" aria-label="Situação do ${c.modelo}">
              ${['Disponível', 'Reservado', 'Vendido'].map((s) => `<option${s === c.situacao ? ' selected' : ''}>${s}</option>`).join('')}</select>`
              : `<span class="pilula ${corSit[c.situacao]}">${c.situacao}</span>`}</td>
            <td><div class="acoes-linha">
              ${podeEditar ? `<button class="bt bt--fan bt--icone" type="button" data-editar="${c.id}" aria-label="Editar ${c.modelo}" title="Editar">${ico('pencil')}</button>` : ''}
              <a class="bt bt--fan bt--icone" href="veiculo.html?id=${c.id}" target="_blank" rel="noopener" aria-label="Ver no site" title="Ver no site">${ico('external-link')}</a>
            </div></td>
          </tr>`).join('') || '<tr><td colspan="8"><p class="vazio">Nenhum carro com esses filtros.</p></td></tr>';
      };
      const salvarSituacao = (c, s) => { c.situacao = s; situacoes[c.id] = s; guardar('pa-painel-situacao', situacoes); };
      $('#tabela-estoque').addEventListener('change', (e) => {
        const s = e.target.closest('.sel-status'); if (!s) return;
        const c = estoque.find((x) => x.id === s.dataset.id); salvarSituacao(c, s.value);
        pintarResumo(); pintarTabela();
        avisar(s.value === 'Vendido' ? `${c.modelo} vendido. Já saiu da vitrine do site.` : `${c.modelo}: ${s.value.toLowerCase()}.`);
      });
      ['#est-busca', '#est-status', '#est-tipo'].forEach((s) => $(s).addEventListener('input', pintarTabela));

      // cadastrar e editar usam o mesmo formulário
      const modal = $('#modal-carro'), form = $('#form-carro');
      const CAMPOS = ['marca', 'modelo', 'versao', 'ano', 'anoModelo', 'km', 'cor', 'portas', 'finais', 'carroceria', 'cambio', 'combustivel',
        'preco', 'precoDe', 'situacao', 'selo', 'garantia', 'resumo'];
      // procedência: 6 itens com campo próprio; o resto vira "Item: valor" no texto livre
      const HIST = { 'Procedência': 'h_procedencia', 'Laudo cautelar': 'h_laudo', 'Sinistro': 'h_sinistro', 'Revisões': 'h_revisoes', 'Chaves': 'h_chaves', 'Manual': 'h_manual' };
      // opcionais: todos os que já existem no estoque viram chips; dá para criar novos
      const COMUNS = ['Ar-condicionado digital', 'Central multimídia', 'Câmera de ré', 'Sensor de estacionamento', 'Piloto automático', 'Piloto adaptativo', 'Bancos em couro', 'Teto solar', 'Teto panorâmico', 'Faróis de LED', 'Rodas de liga leve', 'Painel digital', 'Partida por botão', 'Chave presencial', 'Controle de tração', 'Sensor de chuva', 'Carregador por indução', 'Apple CarPlay e Android Auto', 'Câmera 360', 'Bancos elétricos', 'Porta-malas elétrico', 'Tração 4x4', '7 lugares', 'Som premium'];
      const todosOpcionais = () => COMUNS.slice();
      const pintarOpcionais = (marcados) => {
        const lista = Array.from(new Set(marcados.concat(todosOpcionais())));
        $('#opc-lista').innerHTML = lista.map((o) => `<label><input type="checkbox" value="${o}"${marcados.includes(o) ? ' checked' : ''}>${ico('check')}${o}</label>`).join('');
      };
      const opcionaisMarcados = () => $$('#opc-lista input:checked').map((i) => i.value);
      const addOpcional = () => {
        const v = $('#opc-novo').value.trim(); if (!v) return;
        const m = opcionaisMarcados(); if (!m.includes(v)) m.push(v);
        pintarOpcionais(m); $('#opc-novo').value = ''; $('#opc-novo').focus();
      };
      $('#opc-add').addEventListener('click', addOpcional);
      $('#opc-novo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addOpcional(); } });
      const contaResumo = () => { $('#resumo-conta').textContent = `${form.resumo.value.length} de 600 caracteres`; };
      form.resumo.addEventListener('input', contaResumo);

      const abrirCarro = (c) => {
        form.reset(); $('#previas').innerHTML = '';
        form.id.value = c ? c.id : '';
        $('#modal-carro-titulo').textContent = c ? `Editar ${c.marca} ${c.modelo}` : 'Cadastrar veículo';
        if (c) {
          CAMPOS.forEach((k) => { if (form[k]) form[k].value = c[k] == null ? '' : c[k]; });
          form.destaque.checked = !!c.destaque;
          const outros = [];
          (c.historico || []).forEach(([r, v]) => { if (HIST[r]) form[HIST[r]].value = v; else outros.push(r + ': ' + v); });
          form.h_outros.value = outros.join('\n');
          $('#previas').innerHTML = [c.foto].concat(c.galeria || []).map((f) => `<img src="${f}" alt="">`).join('');
        } else {
          form.garantia.value = '6 meses'; form.portas.value = '4';
        }
        pintarOpcionais(c ? (c.opcionais || []) : []);
        contaResumo();
        mostrarEl($('[data-excluir]', form), !!c && pode('estoque.excluir'));
        abrirModal(modal);
        $('.modal__caixa', modal) && (form.scrollTop = 0);
      };
      $('#novo-carro').addEventListener('click', () => abrirCarro(null));
      $('#tabela-estoque').addEventListener('click', (e) => {
        const b = e.target.closest('[data-editar]'); if (b) abrirCarro(estoque.find((c) => c.id === b.dataset.editar));
      });
      $('.envio-fotos', form).addEventListener('click', () => $('#fotos-carro').click());
      $('#fotos-carro').addEventListener('change', (e) => {
        $('#previas').innerHTML = '';
        Array.from(e.target.files).slice(0, 8).forEach((f) => {
          const r = new FileReader(); r.onload = () => $('#previas').insertAdjacentHTML('beforeend', `<img src="${r.result}" alt="" data-nova>`); r.readAsDataURL(f);
        });
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form));
        const historico = Object.entries(HIST).map(([r, k]) => [r, (d[k] || '').trim()]).filter(([, v]) => v)
          .concat(String(d.h_outros || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Observação', l];
          }));
        const dados = {
          marca: d.marca, modelo: d.modelo, versao: d.versao || '', ano: Number(d.ano), anoModelo: Number(d.anoModelo || d.ano),
          km: Number(d.km), cor: d.cor || '', portas: Number(d.portas), finais: Number(d.finais),
          carroceria: d.carroceria, cambio: d.cambio, combustivel: d.combustivel,
          preco: Number(d.preco), precoDe: d.precoDe ? Number(d.precoDe) : null,
          selo: (d.selo || '').trim() || null, garantia: (d.garantia || '').trim(), destaque: !!d.destaque,
          resumo: (d.resumo || '').trim(), opcionais: opcionaisMarcados(), historico
        };
        const nova = $('#previas img[data-nova]');
        if (nova && nova.src.length < 300000) { dados.foto = nova.src; dados.fotoG = nova.src; }
        if (d.id) {
          const c = estoque.find((x) => x.id === d.id);
          if (c.extra) {
            const x = extras.find((y) => y.id === d.id); Object.assign(x, dados); guardar('pa-painel-carros', extras);
          } else {
            edicoes[d.id] = Object.assign(edicoes[d.id] || {}, dados); guardar('pa-painel-edicoes', edicoes);
          }
          Object.assign(c, dados); salvarSituacao(c, d.situacao);
          avisar(`${c.marca} ${c.modelo} atualizado. O site já mostra a mudança.`);
        } else {
          const novo = Object.assign({ id: 'novo-' + Date.now(), extra: true, criado: Date.now(),
            foto: 'assets/img/estoque/' + ({ SUV: 'rav4', Picape: 'hilux', Sedan: 'fusion', Hatch: 'golf' }[d.carroceria]) + '-800.webp' }, dados);
          if (!novo.fotoG) novo.fotoG = novo.foto.replace('-800', '-1600');
          extras.push(novo); guardar('pa-painel-carros', extras);
          const m = montarCarro(novo); estoque.unshift(m); salvarSituacao(m, d.situacao);
          avisar(`${novo.marca} ${novo.modelo} cadastrado. Já aparece no site.`);
        }
        fecharModal(modal); pintarResumo(); pintarTabela();
      });
      $('[data-excluir]', form).addEventListener('click', () => {
        const c = estoque.find((x) => x.id === form.id.value); if (!c) return;
        if (!confirmar(`Excluir ${c.marca} ${c.modelo} do estoque? Ele sai do site também.`)) return;
        if (c.extra) { extras = extras.filter((x) => x.id !== c.id); guardar('pa-painel-carros', extras); }
        else { removidos.push(c.id); guardar('pa-painel-removidos', removidos); }
        estoque = estoque.filter((x) => x.id !== c.id);
        fecharModal(modal); pintarResumo(); pintarTabela();
        avisar(`${c.modelo} excluído.`);
      });
      pintarResumo(); pintarTabela();
    },

    /* ================================================== AGENDA */
    agenda() {
      let vista = 'mes';
      let ref = new Date(HOJE);                 // dia de referência da vista
      let selecionado = dataISO(HOJE);
      const nomes = EQUIPE.filter((p) => p.ativo).map((p) => primeiro(p.nome));
      $('#cal-tipos').innerHTML = Object.entries(TIPOS_EVENTO).map(([t, v]) => `<span style="--cor:var(${v})"><i></i>${t}</span>`).join('');
      $('#evento-tipo').innerHTML = Object.keys(TIPOS_EVENTO).map((t) => `<option>${t}</option>`).join('');
      $('#evento-quem').innerHTML = (pode('agenda.todos') ? nomes : [meuNome()]).map((n) => `<option>${n}</option>`).join('');
      const selP = $('#cal-pessoa');
      if (pode('agenda.todos')) {
        selP.innerHTML = '<option value="todos">Agenda de todos</option>' + nomes.map((n) => `<option value="${n}">Agenda de ${n}</option>`).join('');
      } else {
        selP.innerHTML = `<option>Minha agenda</option>`; selP.disabled = true;
      }
      selP.addEventListener('change', () => { filtroAgenda = selP.value; pintar(); });

      const cartaoEv = (e) => `<button type="button" class="cartao-evento" data-ev="${e.id}" style="--cor:var(${TIPOS_EVENTO[e.tipo]})">
        <b>${e.hora} · ${e.tipo}</b><span>${e.titulo}</span><span>${e.quem}${e.obs && e.tipo !== 'Reunião' ? ' · ' + e.obs : ''}</span></button>`;
      const inicioSemana = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

      const pintarMes = () => {
        const mes = new Date(ref.getFullYear(), ref.getMonth(), 1);
        $('#cal-titulo').textContent = cap(MESES[mes.getMonth()]) + ' de ' + mes.getFullYear();
        const ini = inicioSemana(mes);
        let html = '<div class="cal-semana"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="cal-grade">';
        for (let i = 0; i < 42; i++) {
          const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
          const iso = dataISO(d), evs = eventosDo(iso);
          const cls = ['cal-dia', d.getMonth() !== mes.getMonth() && 'fora', iso === dataISO(HOJE) && 'hoje', iso === selecionado && 'selecionado'].filter(Boolean).join(' ');
          html += `<div class="${cls}" data-dia="${iso}" role="button" tabindex="0" aria-label="${d.getDate()} de ${MESES[d.getMonth()]}, ${evs.length} compromisso(s)">
            <span class="num">${d.getDate()}</span>
            ${evs.slice(0, 3).map((e) => `<button type="button" class="evento" data-ev="${e.id}" style="--cor:var(${TIPOS_EVENTO[e.tipo]})"><b>${e.hora}</b> ${e.titulo}</button>`).join('')}
            ${evs.length > 3 ? `<span class="mais">+${evs.length - 3} mais</span>` : ''}
            <span class="pontos">${evs.map((e) => `<i style="--cor:var(${TIPOS_EVENTO[e.tipo]})"></i>`).join('')}</span>
          </div>`;
        }
        $('#cal-corpo').innerHTML = html + '</div>';
      };
      const pintarSemana = () => {
        const ini = inicioSemana(ref), fim = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6);
        $('#cal-titulo').textContent = ini.getMonth() === fim.getMonth()
          ? `${ini.getDate()} a ${fim.getDate()} de ${MESES[fim.getMonth()]}`
          : `${ini.getDate()} de ${MESES[ini.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]}`;
        let html = '<div class="cal-semana-grade">';
        for (let i = 0; i < 7; i++) {
          const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
          const iso = dataISO(d), evs = eventosDo(iso);
          html += `<div class="cal-col${iso === dataISO(HOJE) ? ' hoje' : ''}${iso === selecionado ? ' selecionado' : ''}" data-dia="${iso}">
            <header><small>${SEMANA[d.getDay()].slice(0, 3)}</small><b>${d.getDate()}</b></header>
            ${evs.map(cartaoEv).join('') || '<span class="nota-rodape" style="padding:.3rem">Livre</span>'}
          </div>`;
        }
        $('#cal-corpo').innerHTML = html + '</div>';
      };
      const pintarDiaVista = () => {
        const d = ref, iso = dataISO(d);
        $('#cal-titulo').textContent = `${cap(SEMANA[d.getDay()])}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
        const evs = eventosDo(iso);
        let html = '<div class="cal-dia-vista">';
        for (let h = 8; h <= 19; h++) {
          const doH = evs.filter((e) => Number(e.hora.slice(0, 2)) === h);
          html += `<div class="hora-linha" data-hora="${String(h).padStart(2, '0')}:00" title="Clique para marcar às ${h}h"><time>${h}:00</time><div>${doH.map(cartaoEv).join('')}</div></div>`;
        }
        $('#cal-corpo').innerHTML = html + '</div>';
      };
      const pintarLado = () => {
        const d = new Date(selecionado + 'T00:00:00');
        const evs = eventosDo(selecionado);
        $('#dia-titulo').textContent = selecionado === dataISO(HOJE) ? 'Hoje' : `${d.getDate()} de ${MESES[d.getMonth()]}`;
        $('#dia-sub').textContent = `${SEMANA[d.getDay()]} · ${evs.length} compromisso${evs.length === 1 ? '' : 's'} · clique para editar`;
        $('#dia-lista').innerHTML = evs.length ? evs.map(itemEvento).join('') : '<p class="vazio">Nada marcado. Clique em "Novo compromisso".</p>';
      };
      const pintar = () => {
        ({ mes: pintarMes, semana: pintarSemana, dia: pintarDiaVista })[vista]();
        pintarLado();
      };

      $$('#cal-vista button').forEach((b) => b.addEventListener('click', () => {
        vista = b.dataset.vista;
        $$('#cal-vista button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        ref = new Date(selecionado + 'T00:00:00');
        pintar();
      }));
      const mover = (n) => {
        ref = vista === 'mes' ? new Date(ref.getFullYear(), ref.getMonth() + n, 1)
          : new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + n * (vista === 'semana' ? 7 : 1));
        if (vista === 'dia') selecionado = dataISO(ref);
        pintar();
      };
      $('#cal-ant').addEventListener('click', () => mover(-1));
      $('#cal-prox').addEventListener('click', () => mover(1));
      $('#cal-hoje').addEventListener('click', () => { ref = new Date(HOJE); selecionado = dataISO(HOJE); pintar(); });

      // clique: num compromisso edita; num dia seleciona; numa hora vazia cria
      $('#cal-corpo').addEventListener('click', (e) => {
        const ev = e.target.closest('[data-ev]');
        if (ev) { e.stopPropagation(); abrirEvento(ev.dataset.ev); return; }
        const h = e.target.closest('[data-hora]');
        if (h) { novoEvento(dataISO(ref), h.dataset.hora); return; }
        const d = e.target.closest('[data-dia]');
        if (d) { selecionado = d.dataset.dia; pintar(); }
      });
      $('#cal-corpo').addEventListener('dblclick', (e) => {
        const d = e.target.closest('[data-dia]');
        if (d && !e.target.closest('[data-ev]')) { selecionado = d.dataset.dia; ref = new Date(selecionado + 'T00:00:00'); vista = 'dia';
          $$('#cal-vista button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.vista === 'dia'))); pintar(); }
      });
      $('#cal-corpo').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.dia) e.target.click(); });
      $('#dia-lista').addEventListener('click', (e) => { const b = e.target.closest('[data-ev]'); if (b) abrirEvento(b.dataset.ev); });

      const modal = $('#modal-evento'), form = $('#form-evento');
      const novoEvento = (iso, hora) => {
        form.reset(); form.id.value = ''; form.data.value = iso || selecionado; form.hora.value = hora || '10:00';
        form.quem.value = Array.from(form.quem.options).some((o) => o.value === meuNome()) ? meuNome() : form.quem.options[0].value;
        $('#modal-evento-titulo').textContent = 'Novo compromisso';
        mostrarEl($('[data-excluir]', form), false);
        abrirModal(modal);
      };
      abrirEvento = (id) => {
        const ev = eventos.find((x) => x.id === id); if (!ev) return;
        form.reset();
        ['id', 'titulo', 'tipo', 'quem', 'data', 'hora', 'obs'].forEach((k) => { form[k].value = ev[k] || ''; });
        if (!Array.from(form.quem.options).some((o) => o.value === ev.quem)) form.quem.insertAdjacentHTML('beforeend', `<option>${ev.quem}</option>`), form.quem.value = ev.quem;
        $('#modal-evento-titulo').textContent = 'Editar compromisso';
        mostrarEl($('[data-excluir]', form), true);
        abrirModal(modal);
      };
      $('#novo-evento').addEventListener('click', () => novoEvento(selecionado));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form));
        const dd = new Date(d.data + 'T00:00:00');
        if (d.id) { Object.assign(eventos.find((x) => x.id === d.id), d); avisar('Compromisso atualizado.'); }
        else { eventos.push(Object.assign({}, d, { id: 'u' + Date.now() })); avisar(`${d.tipo} marcado para ${dd.getDate()}/${dd.getMonth() + 1} às ${d.hora}.`); }
        salvarAgenda(); selecionado = d.data; ref = dd;
        fecharModal(modal); pintar();
      });
      $('[data-excluir]', form).addEventListener('click', () => {
        if (!confirmar('Excluir este compromisso?')) return;
        eventos = eventos.filter((x) => x.id !== form.id.value); salvarAgenda();
        fecharModal(modal); pintar(); avisar('Compromisso excluído.');
      });

      /* ---------- rotina: tarefas do dia a dia, editáveis --------------- */
      const ROTINA_PADRAO = [
        ['08:00', 'Abrir o pátio e ligar os carros da vitrine', 'Todos'],
        ['08:30', 'Conferir leads que chegaram de madrugada', 'Carlos'],
        ['09:00', 'Responder todo WhatsApp em até 10 minutos', 'Todos'],
        ['10:00', 'Fotografar carros que entraram (estúdio)', 'Thiago'],
        ['11:00', 'Atualizar preços e situação no painel', 'Thiago'],
        ['14:00', 'Retornar propostas em aberto', 'Fernanda'],
        ['16:00', 'Postar um carro no Instagram', 'Thiago'],
        ['17:30', 'Lavar e posicionar os carros de amanhã', 'Ricardo'],
        ['18:00', 'Fechar o caixa e trancar as chaves', 'Patrícia']
      ].map(([hora, texto, quem], i) => ({ id: 'r' + i, hora, texto, quem }));
      let rotina = ler('pa-rotina-lista', null) || ROTINA_PADRAO;
      const salvarRotina = () => guardar('pa-rotina-lista', rotina);
      const chave = 'pa-rotina-feitas-' + dataISO(HOJE);
      const feitas = new Set(ler(chave, ['r0', 'r1']));
      const minhaRotina = () => rotina.filter((r) => pode('agenda.todos') || r.quem === 'Todos' || r.quem === meuNome())
        .sort((a, b) => a.hora.localeCompare(b.hora));
      const pintarRotina = () => {
        const lista = minhaRotina();
        const feitasVis = lista.filter((r) => feitas.has(r.id)).length;
        $('#rotinas').innerHTML = lista.map((r) => `<div class="rotina${feitas.has(r.id) ? ' feita' : ''}">
          <input type="checkbox" data-id="${r.id}"${feitas.has(r.id) ? ' checked' : ''} aria-label="${r.texto}">
          <span>${r.texto}<small class="quem">${r.quem === 'Todos' ? 'Toda a equipe' : r.quem}</small></span><small>${r.hora}</small>
          <span class="acoes-rotina">
            <button type="button" data-editar-rotina="${r.id}" aria-label="Editar tarefa" title="Editar">${ico('pencil')}</button>
            <button type="button" data-apagar-rotina="${r.id}" aria-label="Excluir tarefa" title="Excluir">${ico('trash-2')}</button>
          </span></div>`).join('') || '<p class="vazio">Nenhuma tarefa. Clique em "Tarefa" para criar.</p>';
        $('#rotina-progresso').textContent = `${feitasVis} de ${lista.length} feitas`;
        $('#rotina-barra').style.width = (lista.length ? feitasVis / lista.length * 100 : 0) + '%';
      };
      $('#rotinas').addEventListener('change', (e) => {
        const id = e.target.dataset.id; if (!id) return;
        if (e.target.checked) feitas.add(id); else feitas.delete(id);
        guardar(chave, Array.from(feitas)); pintarRotina();
        if (minhaRotina().every((r) => feitas.has(r.id))) avisar('Rotina do dia completa.');
      });
      const modalR = $('#modal-rotina'), formR = $('#form-rotina');
      $('#rotina-quem').innerHTML = '<option>Todos</option>' + nomes.map((n) => `<option>${n}</option>`).join('');
      const abrirRotina = (r) => {
        formR.reset(); formR.i.value = r ? r.id : '';
        if (r) { formR.texto.value = r.texto; formR.hora.value = r.hora; formR.quem.value = r.quem; }
        else formR.quem.value = pode('agenda.todos') ? 'Todos' : meuNome();
        $('#modal-rotina-titulo').textContent = r ? 'Editar tarefa' : 'Nova tarefa';
        mostrarEl($('[data-excluir]', formR), !!r);
        abrirModal(modalR);
      };
      const apagarRotina = (id) => {
        const r = rotina.find((x) => x.id === id);
        if (!r || !confirmar(`Excluir a tarefa "${r.texto}"?`)) return false;
        rotina = rotina.filter((x) => x.id !== id); salvarRotina(); pintarRotina(); avisar('Tarefa excluída.'); return true;
      };
      $('#nova-rotina').addEventListener('click', () => abrirRotina(null));
      $('#rotinas').addEventListener('click', (e) => {
        const ed = e.target.closest('[data-editar-rotina]'); if (ed) { e.preventDefault(); abrirRotina(rotina.find((x) => x.id === ed.dataset.editarRotina)); return; }
        const ap = e.target.closest('[data-apagar-rotina]'); if (ap) { e.preventDefault(); apagarRotina(ap.dataset.apagarRotina); }
      });
      formR.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(formR));
        if (d.i) Object.assign(rotina.find((x) => x.id === d.i), { texto: d.texto, hora: d.hora, quem: d.quem });
        else rotina.push({ id: 'r' + Date.now(), texto: d.texto, hora: d.hora, quem: d.quem });
        salvarRotina(); fecharModal(modalR); pintarRotina(); avisar(d.i ? 'Tarefa atualizada.' : 'Tarefa criada na rotina.');
      });
      $('[data-excluir]', formR).addEventListener('click', () => { if (apagarRotina(formR.i.value)) fecharModal(modalR); });

      pintar(); pintarRotina();
    },

    /* ================================================== LEADS */
    leads() {
      const icOrigem = { 'WhatsApp do site': 'whatsapp', 'Simulador': 'banknote', 'Página do carro': 'car-front', 'Instagram': 'camera', 'Google': 'search', 'Indicação': 'users', 'Loja (presencial)': 'store' };
      const vendem = QUEM_VENDE().map((p) => primeiro(p.nome));
      const selP = $('#leads-pessoa');
      if (pode('leads.todos')) {
        selP.innerHTML = '<option value="todos">Leads de todos</option>' + vendem.map((n) => `<option value="${n}">Leads de ${n}</option>`).join('');
      } else { selP.innerHTML = '<option>Meus leads</option>'; selP.disabled = true; }
      selP.addEventListener('change', () => { filtroLeads = selP.value; pintar(); });

      const tempo = (ms) => { const h = Math.max(1, Math.round((Date.now() - ms) / 3600000)); return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dia(s)`; };
      const pintar = () => {
        const vis = leadsVisiveis();
        $('#quadro').innerHTML = ETAPAS.map((et) => {
          const doEt = vis.filter((l) => l.etapa === et);
          return `<div class="coluna" data-etapa="${et}"><h3>${et}<span>${doEt.length}</span></h3>
            ${doEt.map((l) => { const c = carroDoLead(l); return `<article class="lead" draggable="true" data-id="${l.id}" tabindex="0">
              <div style="display:flex;justify-content:space-between;gap:.5rem"><b>${l.nome}</b><span class="temp temp--${l.temp}">${l.temp}</span></div>
              <p>${c ? `${c.marca} ${c.modelo} · ${brl(c.preco)}` : 'Sem carro definido'}</p>
              <span class="pilula pilula--azul">${ico(icOrigem[l.origem] || 'user', l.origem === 'WhatsApp do site')}${l.origem}${l.auto ? ' · automático' : ''}</span>
              <div class="rodape-lead"><span class="resp"><i>${iniciais(l.resp)}</i>${l.resp} · ${tempo(l.criado)}</span>
                <a class="zap" href="${linkZap('Olá, ' + primeiro(l.nome) + '! Aqui é da ponto AUTO' + (c ? ', sobre o ' + c.marca + ' ' + c.modelo : '') + '.')}" target="_blank" rel="noopener" aria-label="Chamar no WhatsApp">${ico('whatsapp', true)}</a></div>
            </article>`; }).join('') || '<p class="vazio">Arraste um lead para cá</p>'}</div>`;
        }).join('');
        $('#nav-leads').textContent = vis.filter((l) => l.etapa === 'Novo').length;
      };

      // arrastar entre etapas
      let arrastando = null;
      $('#quadro').addEventListener('dragstart', (e) => { const c = e.target.closest('.lead'); if (!c) return; arrastando = c.dataset.id; c.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; });
      $('#quadro').addEventListener('dragend', (e) => { e.target.classList && e.target.classList.remove('arrastando'); $$('.coluna').forEach((c) => c.classList.remove('alvo')); });
      $('#quadro').addEventListener('dragover', (e) => { const col = e.target.closest('.coluna'); if (!col) return; e.preventDefault(); $$('.coluna').forEach((c) => c.classList.toggle('alvo', c === col)); });
      $('#quadro').addEventListener('drop', (e) => {
        const col = e.target.closest('.coluna'); if (!col || !arrastando) return; e.preventDefault();
        const l = leads.find((x) => x.id === arrastando); const antes = l.etapa; l.etapa = col.dataset.etapa;
        salvarLeads(); arrastando = null; pintar();
        if (antes !== l.etapa) avisar(l.etapa === 'Vendido' ? `Venda para ${l.nome}! Entra na meta do mês.` : `${l.nome} passou para "${l.etapa}".`);
      });

      // criar e editar
      const modal = $('#modal-lead'), form = $('#form-lead');
      $('#lead-carro').innerHTML = '<option value="">Ainda não sabe</option>' + estoque.filter((c) => c.situacao !== 'Vendido')
        .map((c) => `<option value="${c.id}">${c.marca} ${c.modelo} ${c.ano}, ${brl(c.preco)}</option>`).join('');
      $('#lead-origem').innerHTML = ORIGENS.map((o) => `<option>${o}</option>`).join('');
      $('#lead-etapa').innerHTML = ETAPAS.map((o) => `<option>${o}</option>`).join('');
      $('#lead-resp').innerHTML = (pode('leads.todos') ? vendem : [meuNome()]).map((o) => `<option>${o}</option>`).join('');
      const abrirLead = (l) => {
        form.reset(); form.id.value = l ? l.id : '';
        if (l) {
          ['nome', 'telefone', 'origem', 'etapa', 'temp', 'obs'].forEach((k) => { form[k].value = l[k] || ''; });
          form.carro.value = l.carroId || '';
          if (!Array.from(form.resp.options).some((o) => o.value === l.resp)) form.resp.insertAdjacentHTML('beforeend', `<option>${l.resp}</option>`);
          form.resp.value = l.resp;
        } else {
          form.origem.value = 'Loja (presencial)'; form.etapa.value = 'Novo'; form.temp.value = 'Morno';
          form.resp.value = Array.from(form.resp.options).some((o) => o.value === meuNome()) ? meuNome() : form.resp.options[0].value;
        }
        $('#modal-lead-titulo').textContent = l ? `Editar lead: ${l.nome}` : 'Novo lead';
        mostrarEl($('[data-excluir]', form), !!l);
        abrirModal(modal);
      };
      $('#novo-lead').addEventListener('click', () => abrirLead(null));
      $('#quadro').addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const c = e.target.closest('.lead'); if (c) abrirLead(leads.find((x) => x.id === c.dataset.id));
      });
      $('#quadro').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('lead')) e.target.click(); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form));
        const dados = { nome: d.nome, telefone: d.telefone, carroId: d.carro, origem: d.origem, etapa: d.etapa, resp: d.resp, temp: d.temp, obs: d.obs };
        if (d.id) { Object.assign(leads.find((x) => x.id === d.id), dados); avisar(`Lead de ${d.nome} atualizado.`); }
        else { leads.unshift(Object.assign({ id: 'l' + Date.now(), criado: Date.now(), auto: false }, dados)); avisar(`Lead de ${d.nome} criado para ${d.resp}.`); }
        salvarLeads(); fecharModal(modal); pintar();
      });
      $('[data-excluir]', form).addEventListener('click', () => {
        const l = leads.find((x) => x.id === form.id.value);
        if (!l || !confirmar(`Excluir o lead de ${l.nome}?`)) return;
        leads = leads.filter((x) => x.id !== l.id); salvarLeads(); fecharModal(modal); pintar(); avisar('Lead excluído.');
      });
      pintar();
    },

    /* ================================================== VISITANTES DO SITE */
    site() {
      const reais = cliquesReais();
      const v = soma(30, 'visitas'), c = soma(30, 'cliques') + reais.length;
      $('#kpis-site').innerHTML = [
        ['users', 'Visitantes únicos', nf(v * .81)], ['eye', 'Páginas vistas', nf(v * 3.4)], ['clock', 'Tempo médio', '2 min 47 s'],
        ['mouse-pointer-click', 'Chamaram no WhatsApp', (c / v * 100).toFixed(1).replace('.', ',') + '%'], ['cookie', 'Aceitaram cookies', '78%']
      ].map(([i, r, val]) => `<article class="cartao kpi"><span class="kpi__rotulo">${ico(i)}${r}</span><span class="kpi__valor">${val}</span></article>`).join('');

      const s = SERIE.slice(-30), rot = s.map((x) => x.d.getDate() + '/' + (x.d.getMonth() + 1));
      linha('g-visitantes', rot, s.map((x) => x.visitas), 'Visitantes', css('--s1'));
      linha('g-cliques', rot, s.map((x, i) => x.cliques + (i === s.length - 1 ? reais.length : 0)), 'Cliques no WhatsApp', css('--s3'));

      const lista = (id, itens, tom) => {
        const max = Math.max(...itens.map((x) => x[1]));
        $(id).innerHTML = itens.map(([r, n, extra]) => `<li><span>${extra ? ico(extra) + ' ' : ''}<b>${r}</b></span><span class="valor">${typeof n === 'number' && n <= 100 && id !== '#botoes-zap' ? n + '%' : nf(n)}</span>
          <span class="trilho"><i data-tom="${tom}" style="width:${n / max * 100}%"></i></span></li>`).join('');
      };
      lista('#origens', [['Instagram', 41], ['Google', 27], ['Direto (digitou o site)', 14], ['WhatsApp', 11], ['Facebook', 7]], 1);
      lista('#aparelhos', [['Celular', 78, 'smartphone'], ['Computador', 19, 'monitor'], ['Tablet', 3, 'tablet']], 1);
      lista('#cidades', [['Belo Horizonte', 44], ['Contagem', 13], ['Betim', 9], ['Nova Lima', 7], ['Sete Lagoas', 5], ['Ipatinga', 4], ['Itabira', 3], ['Outras cidades de MG', 11], ['Fora de MG', 4]], 1);
      const botoes = [['Botão da página do carro', Math.round(c * .38)], ['Botão flutuante', Math.round(c * .24)], ['Simulador de financiamento', Math.round(c * .17)], ['Topo do site', Math.round(c * .13)], ['Vitrine da home', Math.round(c * .08)]];
      lista('#botoes-zap', botoes, 3);

      // mapa de calor: dia x hora, uma cor só (sequencial), clara para escura
      const passos = ['#e9f1fc', '#c5dbf6', '#94bdee', '#5f9be3', '#2a78d6', '#1d5bb0'];
      const r = semente(99);
      let html = '<span></span>' + Array.from({ length: 24 }, (_, h) => `<span class="hora">${h % 3 === 0 ? h + 'h' : ''}</span>`).join('');
      ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach((dia, di) => {
        html += `<span>${dia}</span>`;
        for (let h = 0; h < 24; h++) {
          const base = h < 7 ? .05 : h < 11 ? .35 : h < 14 ? .6 : h < 18 ? .5 : h < 22 ? .95 : .3;
          const peso = di === 5 ? 1.2 : di === 6 ? .75 : 1;
          const x = Math.min(1, base * peso * (.8 + r() * .35));
          const vis = Math.round(x * 64);
          html += `<i style="--c:${passos[Math.min(5, Math.floor(x * 6))]}" title="${dia}, ${h}h: ${vis} visitas por hora (média)"></i>`;
        }
      });
      $('#calor').innerHTML = html;
      $('#escala').innerHTML = 'Menos' + passos.map((p) => `<i style="background:${p}"></i>`).join('') + 'Mais · o pico é à noite, das 19h às 22h, e no sábado';

      lista('#cookies', [['Aceitaram todos', 78], ['Só os essenciais', 17], ['Recusaram', 5]], 1);
      $('#tabela-cookies').innerHTML = [
        ['pa_sessao', 'Manter a visita contínua entre páginas', 'Sessão'],
        ['pa_consentimento', 'Lembrar a escolha de cookies', '12 meses'],
        ['_ga', 'Contar visitas (Google Analytics)', '13 meses'],
        ['_fbp', 'Medir anúncios do Instagram e Facebook', '3 meses']
      ].map((l) => `<tr><td><b>${l[0]}</b></td><td>${l[1]}</td><td>${l[2]}</td></tr>`).join('');

      // últimos visitantes: os cliques reais deste navegador entram no topo
      const rr = semente(31);
      const cidades = ['Belo Horizonte', 'Contagem', 'Betim', 'Nova Lima', 'Sete Lagoas', 'Belo Horizonte', 'Ipatinga'];
      const origens = ['Instagram', 'Google', 'Direto', 'WhatsApp', 'Instagram'];
      const linhas = reais.slice(-5).reverse().map((k) => ({ quando: horaRelativa(k.quando), cidade: 'Você (este navegador)', ap: 'Computador', origem: 'Direto', viu: k.pagina || 'Home', zap: true, voce: true }));
      for (let i = 0; i < 10 - linhas.length; i++) {
        const car = ESTOQUE[Math.floor(rr() * ESTOQUE.length)];
        linhas.push({ quando: `há ${i * 7 + Math.floor(rr() * 6) + 2} min`, cidade: cidades[Math.floor(rr() * cidades.length)], ap: rr() < .78 ? 'Celular' : 'Computador',
          origem: origens[Math.floor(rr() * origens.length)], viu: `Home, ${car.modelo}`, zap: rr() < .3 });
      }
      $('#tabela-visitantes').innerHTML = linhas.map((l) => `<tr${l.voce ? ' style="background:#f1faf4"' : ''}><td>${l.quando}</td><td>${l.cidade}</td><td>${l.ap}</td><td>${l.origem}</td><td>${l.viu}</td>
        <td>${l.zap ? `<span class="pilula pilula--bom">${ico('whatsapp', true)}Chamou</span>` : '<span class="nota-rodape">Não</span>'}</td></tr>`).join('');
    },

    /* ================================================== METAS */
    metas() {
      const dia = HOJE.getDate(), diasMes = new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 0).getDate();
      $('#metas-sub').textContent = `${MESES[HOJE.getMonth()]}: dia ${dia} de ${diasMes}. Faltam ${diasMes - dia} dias para fechar o mês.`;
      const leads30 = Math.round((soma(30, 'cliques') + cliquesReais().length) * .24);
      const ativos = estoque.filter((c) => c.situacao !== 'Vendido');
      const giro = Math.round(ativos.reduce((s, c) => s + c.diasPatio, 0) / Math.max(1, ativos.length));
      const aneis = [
        ['Carros vendidos', VENDAS_MES / META.vendas, `${VENDAS_MES}`, `de ${META.vendas}`, `Ritmo atual fecha o mês com ${Math.round(VENDAS_MES / dia * diasMes)}`],
        ['Faturamento', FATURAMENTO / META.faturamento, brlMi(FATURAMENTO).replace('R$ ', ''), 'de 5,00 mi', `${Math.round(FATURAMENTO / META.faturamento * 100)}% da meta`],
        ['Leads novos', leads30 / META.leads, nf(leads30), `de ${META.leads}`, 'Contatos vindos do site'],
        ['Tempo no pátio', Math.min(1, META.giro / Math.max(giro, 1)), giro + 'd', `meta: até ${META.giro}`, giro <= META.giro ? 'Dentro da meta' : 'Acima da meta']
      ];
      const C = 2 * Math.PI * 56;
      $('#aneis').innerHTML = aneis.map(([t, p, v, s, nota]) => `<article class="cartao meta-cartao">
        <div class="anel"><svg viewBox="0 0 132 132"><circle class="fundo-anel" cx="66" cy="66" r="56"/><circle class="frente" cx="66" cy="66" r="56" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-alvo="${C * (1 - Math.min(1, p))}"/></svg>
        <div><b>${v}</b><small>${s}</small></div></div><h3>${t}</h3><p>${nota}</p></article>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => $$('#aneis .frente').forEach((c) => { c.style.strokeDashoffset = c.dataset.alvo; })));

      barrasComMeta('g-vendas');
      const vend = VENDEDORES.filter((x) => x.vendas);
      $('#ranking').innerHTML = vend.map((x, i) => `<li><span class="mini-foto"><span class="pilula ${i === 0 ? 'pilula--alerta' : 'pilula--neutro'}">${i + 1}º</span><b>${x.nome}</b></span>
        <span class="valor">${x.vendas} carros</span><span class="trilho"><i style="width:${x.vendas / vend[0].vendas * 100}%"></i></span></li>`).join('');
    },

    /* ================================================== EQUIPE */
    equipe() {
      const quando = ['agora', 'há 12 min', 'há 1 h', 'ontem, 18:40', 'há 2 dias', 'há 3 dias'];
      const perfilDe = (perms) => Object.keys(PERFIS).find((k) => PERFIS[k].length === perms.length && PERFIS[k].every((p) => perms.includes(p))) || 'Personalizado';
      const pintar = () => {
        $('#tabela-equipe').innerHTML = EQUIPE.map((p, i) => `<tr${p.ativo ? '' : ' style="opacity:.55"'}>
          <td><div class="carro-celula" style="min-width:210px"><span class="perfil" style="border:0;padding:0;background:none"><span class="av">${iniciais(p.nome)}</span></span>
            <div><b>${p.nome}${p.id === eu.id ? ' <span class="pilula pilula--azul">você</span>' : ''}</b><small>${p.email || ''}</small></div></div></td>
          <td>${p.funcao || ''}<br><small class="nota-rodape">${perfilDe(p.perms)}</small></td>
          <td><div class="chips-perm">${p.perms.length === TODAS.length ? '<span class="pilula pilula--azul">Tudo</span>'
            : ['Própria agenda', 'Próprios leads'].concat(p.perms.map((k) => ROTULO_PERM[k])).map((r) => `<span class="pilula pilula--neutro">${r}</span>`).join('')}</div></td>
          <td>${p.ativo ? (quando[i] || 'nunca entrou') : 'bloqueado'}</td>
          <td><span class="pilula ${p.ativo ? 'pilula--bom' : 'pilula--critico'}">${ico(p.ativo ? 'circle-check' : 'lock')}${p.ativo ? 'Ativo' : 'Bloqueado'}</span></td>
          <td><button class="bt bt--sec" type="button" data-pessoa="${p.id}">${ico('pencil')}Editar acesso</button></td></tr>`).join('');
      };

      const modal = $('#modal-pessoa'), form = $('#form-pessoa');
      $('#pessoa-perfil').innerHTML = Object.keys(PERFIS).concat('Personalizado').map((k) => `<option>${k}</option>`).join('');
      $('#permissoes').innerHTML = PERMISSOES.map((g) => `<div class="grupo-perm"><h3>${ico(g.icone)}${g.grupo}</h3>
        ${g.fixo ? `<label class="fixo"><input type="checkbox" checked disabled><span>${g.fixo}<small>Padrão para todo mundo</small></span></label>` : ''}
        ${g.itens.map(([k, r, s]) => `<label><input type="checkbox" data-perm-chk="${k}"><span>${r}<small>${s}</small></span></label>`).join('')}</div>`).join('');
      const marcadas = () => $$('[data-perm-chk]', form).filter((c) => c.checked).map((c) => c.dataset.permChk);
      const marcar = (perms) => $$('[data-perm-chk]', form).forEach((c) => { c.checked = perms.includes(c.dataset.permChk); });
      // ver estoque é pré-requisito de editar e excluir
      form.addEventListener('change', (e) => {
        if (e.target.id === 'pessoa-perfil' && PERFIS[e.target.value]) marcar(PERFIS[e.target.value]);
        const k = e.target.dataset && e.target.dataset.permChk;
        if (k) {
          if ((k === 'estoque.editar' || k === 'estoque.excluir') && e.target.checked) $('[data-perm-chk="estoque.ver"]', form).checked = true;
          if (k === 'estoque.ver' && !e.target.checked) ['estoque.editar', 'estoque.excluir'].forEach((x) => { $(`[data-perm-chk="${x}"]`, form).checked = false; });
          form.perfil.value = perfilDe(marcadas());
        }
      });
      const abrir = (p) => {
        form.reset(); form.id.value = p ? p.id : '';
        form.nome.value = p ? p.nome : ''; form.email.value = p ? (p.email || '') : ''; form.funcao.value = p ? (p.funcao || '') : '';
        const perms = p ? p.perms : PERFIS['Vendedor'];
        marcar(perms); form.perfil.value = perfilDe(perms); form.ativo.checked = p ? p.ativo : true;
        $('#modal-pessoa-titulo').textContent = p ? `Acesso de ${primeiro(p.nome)}` : 'Convidar pessoa';
        mostrarEl($('[data-excluir]', form), !!p && p.id !== eu.id);
        form.ativo.disabled = !!p && p.id === eu.id;
        abrirModal(modal);
      };
      $('#tabela-equipe').addEventListener('click', (e) => { const b = e.target.closest('[data-pessoa]'); if (b) abrir(EQUIPE.find((p) => p.id === b.dataset.pessoa)); });
      $('#convidar').addEventListener('click', () => abrir(null));

      const temAdmin = (lista) => lista.some((p) => p.ativo && p.perms.includes('equipe.gerenciar'));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const perms = marcadas();
        const dados = { nome: form.nome.value.trim(), email: form.email.value.trim(), funcao: form.funcao.value.trim(),
          perfil: perfilDe(perms), perms, ativo: form.ativo.disabled ? true : form.ativo.checked };
        const id = form.id.value;
        const simulado = EQUIPE.map((p) => p.id === id ? Object.assign({}, p, dados) : p);
        if (!temAdmin(id ? simulado : simulado.concat(dados))) { avisar('Precisa sobrar pelo menos uma pessoa que gerencia a equipe.'); return; }
        if (id) Object.assign(EQUIPE.find((p) => p.id === id), dados);
        else EQUIPE.push(Object.assign({ id: 'p' + Date.now(), vendas: 0 }, dados));
        salvarEquipe(); fecharModal(modal); pintar();
        if (id === eu.id) { avisar('Seu acesso mudou. Recarregando o painel...'); setTimeout(() => location.reload(), 900); }
        else avisar(id ? `Acesso de ${primeiro(dados.nome)} atualizado. Teste em "Ver como", no topo.` : `Convite enviado para ${dados.email || primeiro(dados.nome)}.`);
        $('#ver-como').innerHTML = EQUIPE.filter((p) => p.ativo).map((p) => `<option value="${p.id}"${p.id === eu.id ? ' selected' : ''}>${p.nome}</option>`).join('');
      });
      $('[data-excluir]', form).addEventListener('click', () => {
        const p = EQUIPE.find((x) => x.id === form.id.value);
        if (!p || !confirmar(`Remover ${p.nome} da equipe? Os leads e compromissos dela continuam no painel.`)) return;
        const resto = EQUIPE.filter((x) => x.id !== p.id);
        if (!temAdmin(resto)) { avisar('Precisa sobrar pelo menos uma pessoa que gerencia a equipe.'); return; }
        EQUIPE.splice(EQUIPE.indexOf(p), 1); salvarEquipe(); fecharModal(modal); pintar(); avisar(`${p.nome} removido(a).`);
        $('#ver-como').innerHTML = EQUIPE.filter((x) => x.ativo).map((x) => `<option value="${x.id}"${x.id === eu.id ? ' selected' : ''}>${x.nome}</option>`).join('');
      });
      pintar();
    }
  };

  /* ---------- feed de cliques no WhatsApp (reais + fictícios) ------------ */
  function horaRelativa(ms) {
    const m = Math.round((Date.now() - ms) / 60000);
    return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : `há ${Math.round(m / 60)} h`;
  }
  function pintarFeed(destacar) {
    const reais = cliquesReais().slice(-4).reverse().map((k) => ({ t: horaRelativa(k.quando), o: k.rotulo || 'Botão do site', c: k.pagina || 'Site', real: true }));
    const r = semente(5);
    const falsos = Array.from({ length: 6 - Math.min(4, reais.length) }, (_, i) => {
      const c = ESTOQUE[Math.floor(r() * ESTOQUE.length)];
      return { t: `há ${[4, 11, 19, 34, 52, 70][i]} min`, o: ['Página do carro', 'Simulador', 'Botão flutuante', 'Vitrine da home'][Math.floor(r() * 4)], c: `${c.marca} ${c.modelo}` };
    });
    $('#feed-zap').innerHTML = reais.concat(falsos).map((f, i) => `<li${destacar && i === 0 ? ' class="novo"' : ''}>
      <span class="bolinha${f.real ? '' : ' bolinha--azul'}">${ico(f.real ? 'whatsapp' : 'mouse-pointer-click', f.real)}</span>
      <span><b>${f.c}</b><br><small>${f.o}${f.real ? ' · clique feito agora no site' : ''}</small></span><small>${f.t}</small></li>`).join('');
  }
  // site aberto em outra aba: o clique chega aqui na hora
  window.addEventListener('storage', (e) => {
    if (e.key !== 'pa-cliques') return;
    if (iniciadas.has('visao')) { pintarFeed(true); }
    const ult = cliquesReais().slice(-1)[0];
    avisar(`Novo clique no WhatsApp: ${ult && ult.pagina ? ult.pagina : 'site'}.`);
  });

  /* ---------- modais ----------------------------------------------------- */
  function confirmar(txt) { return window.confirm(txt); }
  function abrirModal(m) { m.classList.add('aberto'); setTimeout(() => { const c = $('input, select', m); c && c.focus(); }, 80); }
  function fecharModal(m) { m.classList.remove('aberto'); }
  $$('.modal').forEach((m) => {
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-fecha]')) fecharModal(m); });
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.aberto').forEach(fecharModal); });

  /* ---------- permissões na tela e "ver como" ------------------------- */
  $$('[data-perm]').forEach((el) => mostrarEl(el, pode(el.dataset.perm)));
  $('#ver-como').innerHTML = EQUIPE.filter((p) => p.ativo).map((p) => `<option value="${p.id}"${p.id === eu.id ? ' selected' : ''}>${p.nome}</option>`).join('');
  $('#eu-ini').textContent = iniciais(eu.nome);
  $('#ver-como').addEventListener('change', (e) => { guardar('pa-painel-eu', e.target.value); location.reload(); });
  const PERM_TELA = { estoque: 'estoque.ver', site: 'site.ver', metas: 'metas.ver', equipe: 'equipe.gerenciar' };

  // contadores da lateral já na abertura
  $('#nav-estoque').textContent = estoque.filter((c) => c.situacao !== 'Vendido').length;
  $('#nav-leads').textContent = leadsVisiveis().filter((l) => l.etapa === 'Novo').length;

  mostrar(location.hash.slice(1) || 'visao');
})();

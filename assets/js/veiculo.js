/* ==========================================================================
   ponto AUTO, página de veículo
   --------------------------------------------------------------------------
   A página é uma casca só. O carro vem do ?id= na URL e todo o conteúdo é
   montado a partir de dados.js. Uma página serve o estoque inteiro, então o
   vendedor manda o link direto do carro no WhatsApp e cai na ficha certa.

   Se o id não existir (link velho de carro já vendido), a página não quebra:
   mostra um aviso e joga a pessoa para o estoque.
   ========================================================================== */

function montarVeiculo() {
  const raiz = document.getElementById('veiculo');
  if (!raiz) return;

  const $ = (s, e = document) => e.querySelector(s);
  const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));

  const id = new URLSearchParams(location.search).get('id');
  const c = carroPorId(id) || ESTOQUE[0];
  const vendido = id && !carroPorId(id);

  document.title = `${c.marca} ${c.modelo} ${c.versao} ${c.ano} | ponto AUTO`;
  $('meta[name="description"]')?.setAttribute('content',
    `${c.marca} ${c.modelo} ${c.versao}, ${c.ano}/${c.anoModelo}, ${fmtKm(c.km)}, ${c.cambio}. ${fmtPreco(c.preco)} com laudo aprovado e garantia de 6 meses.`);

  /* ---------- migalha e título ------------------------------------------ */

  $('#migalha').innerHTML =
    `<a href="index.html" style="text-decoration:underline">Início</a> /
     <a href="estoque.html" style="text-decoration:underline">Estoque</a> /
     ${c.marca} ${c.modelo}`;

  if (vendido) {
    $('#aviso-vendido').hidden = false;
  }

  $('#titulo').innerHTML =
    `<span class="topo-veiculo__marca">${c.marca}</span> ${c.modelo}`;
  $('#versao').textContent = c.versao;

  /* ---------- galeria ---------------------------------------------------- */

  const fotos = [c.fotoG || c.foto].concat(c.galeria || [], GALERIA_EXTRA);
  const miniaturas = [c.foto].concat(c.galeria || [], GALERIA_EXTRA);
  let atual = 0;

  const principal = $('#foto-principal');
  const contador = $('#galeria-contador');
  const tiras = $('#galeria-tiras');

  tiras.innerHTML = miniaturas.map((f, i) =>
    `<button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Foto ${i + 1}">
       <img src="${f}" alt="" loading="lazy">
     </button>`).join('');

  function mostrar(i, direcao = 0) {
    atual = (i + fotos.length) % fotos.length;
    principal.src = fotos[atual];
    if (direcao && principal.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      principal.animate(
        [{ opacity: 0, transform: 'translateX(' + (direcao * 5) + '%) scale(1.03)' }, { opacity: 1, transform: 'none' }],
        { duration: 550, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }
    principal.alt = `${c.marca} ${c.modelo} ${c.versao}, foto ${atual + 1} de ${fotos.length}`;
    contador.textContent = `${atual + 1} / ${fotos.length}`;
    $$('button', tiras).forEach((b, k) => b.setAttribute('aria-current', String(k === atual)));
  }

  tiras.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-i]');
    if (b) mostrar(Number(b.dataset.i), Number(b.dataset.i) >= atual ? 1 : -1);
  });
  $('#foto-ant').addEventListener('click', () => mostrar(atual - 1, -1));
  $('#foto-prox').addEventListener('click', () => mostrar(atual + 1, 1));

  /* lupa: clique na foto abre em tela cheia */
  const lupa = $('#lupa');
  const lupaImg = $('#lupa-img');
  principal.addEventListener('click', () => {
    lupaImg.src = fotos[atual];
    lupa.classList.add('aberta');
    window.pontoAuto.travar();
  });
  const fecharLupa = () => { lupa.classList.remove('aberta'); window.pontoAuto.destravar(); };
  $('#fecha-lupa').addEventListener('click', fecharLupa);
  lupa.addEventListener('click', (ev) => { if (ev.target === lupa) fecharLupa(); });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && lupa.classList.contains('aberta')) return fecharLupa();
    if (lupa.classList.contains('aberta')) return;
    if (ev.key === 'ArrowLeft') mostrar(atual - 1, -1);
    if (ev.key === 'ArrowRight') mostrar(atual + 1, 1);
  });

  mostrar(0);

  /* ---------- painel de preço ------------------------------------------- */

  const TAXA = 0.0169, PRAZO = 48;
  const financiado = c.preco * 0.7;
  const parcela = financiado * TAXA / (1 - Math.pow(1 + TAXA, -PRAZO));

  $('#painel').innerHTML = `
    ${c.selo ? `<span class="selo selo--acento">${c.selo}</span>` : ''}
    ${c.precoDe ? `<p class="de"><s>${fmtPreco(c.precoDe)}</s> agora por</p>` : '<p class="de">Preço à vista</p>'}
    <p class="valor">${fmtPreco(c.preco)}</p>
    <p class="parcela-linha">
      ${ico('hand-coins')}
      ou entrada de 30% e <b>${PRAZO}x de ${fmtPreco(Math.round(parcela))}</b>
    </p>
    <div class="acoes">
      <a class="btn btn--zap btn--bloco" href="${zapCarro(c)}">
        ${ico('whatsapp').replace('class="icone"', 'class="icone icone--cheio"')}
        Falar sobre esse carro
      </a>
      <a class="btn btn--vazado-escuro btn--bloco" href="index.html#simular">
        ${ico('banknote')} Simular financiamento
      </a>
    </div>
    <ul class="garantias">
      <li>${ico('circle-check')} Laudo cautelar aprovado</li>
      <li>${ico('circle-check')} Garantia de ${c.garantia || '6 meses'} de motor e câmbio</li>
      <li>${ico('circle-check')} Aceitamos seu usado na troca</li>
      <li>${ico('circle-check')} Transferência e emplacamento inclusos</li>
    </ul>`;

  /* ---------- resumo, ficha e opcionais --------------------------------- */

  $('#resumo').textContent = c.resumo || '';
  $('#resumo').closest('div').style.display = c.resumo ? '' : 'none';

  const ficha = [
    ['Ano', `${c.ano}/${c.anoModelo}`, 'calendar'],
    ['Quilometragem', fmtKm(c.km), 'gauge'],
    ['Câmbio', c.cambio, 'cog'],
    ['Combustível', c.combustivel, 'fuel'],
    ['Cor', c.cor, 'palette'],
    ['Portas', c.portas, 'door-open'],
    ['Carroceria', c.carroceria, 'car-front'],
    ['Final da placa', c.finais, 'scan-line'],
    ['Garantia', c.garantia || '6 meses', 'shield-check']
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');
  $('#ficha').innerHTML = ficha.map(([r, v]) =>
    `<div><dt>${r}</dt><dd>${v}</dd></div>`).join('');

  $('#opcionais').closest('div').style.display = (c.opcionais || []).length ? '' : 'none';
  $('#opcionais').innerHTML = (c.opcionais || []).map((o) =>
    `<li>${ico('check')}${o}</li>`).join('');

  $('#historico').closest('div').style.display = (c.historico || []).length ? '' : 'none';
  $('#historico').innerHTML = (c.historico || []).map(([r, v]) =>
    `<div><dt>${r}</dt><dd>${v}</dd></div>`).join('');

  /* ---------- outras escolhas ------------------------------------------- */

  /* Primeiro os do mesmo tipo de carroceria, depois os de preço parecido.
     Um site de loja que só mostra "mais quatro carros quaisquer" desperdiça
     a visita de quem já demonstrou o que procura. */
  const relacionados = ESTOQUE
    .filter((o) => o.id !== c.id)
    .sort((a, b) => {
      const tipo = (x) => (x.carroceria === c.carroceria ? 0 : 1);
      return tipo(a) - tipo(b) || Math.abs(a.preco - c.preco) - Math.abs(b.preco - c.preco);
    })
    .slice(0, 4);
  $('#relacionados').innerHTML = relacionados.map((o) => cartaoCarro(o)).join('');

  /* ---------- dados estruturados ---------------------------------------- */

  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${c.marca} ${c.modelo} ${c.versao}`,
    brand: { '@type': 'Brand', name: c.marca },
    model: c.modelo,
    vehicleModelDate: String(c.anoModelo),
    color: c.cor,
    fuelType: c.combustivel,
    vehicleTransmission: c.cambio,
    numberOfDoors: c.portas,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.km, unitCode: 'KMT' },
    offers: {
      '@type': 'Offer',
      price: c.preco,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition'
    }
  });
  document.head.appendChild(ld);
}

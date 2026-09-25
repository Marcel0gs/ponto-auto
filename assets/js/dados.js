/* ==========================================================================
   ponto AUTO, dados do estoque (demonstração)
   --------------------------------------------------------------------------
   Este arquivo é a única fonte de verdade do site. Trocar o conteúdo daqui
   troca a home, o estoque e a página de veículo de uma vez.

   Ao virar site de cliente de verdade, é aqui que entra o estoque real, ou
   é este array que passa a ser carregado de um backend (Supabase, planilha,
   API do sistema da loja). O resto do site não precisa mudar.

   FOTOS: todas no mesmo estúdio (fundo cinza claro, mesmo piso, mesma luz),
   em 4:3. `foto` é a versão de 800px (cartões) e `fotoG` a de 1600px
   (vitrine da home e galeria da página do carro).
   ========================================================================== */

const LOJA = {
  nome: 'ponto AUTO',
  telefone: '(31) 3000-0000',
  telefoneLink: '+553130000000',
  whatsapp: '5531900000000',
  email: 'contato@pontoauto.com.br',
  endereco: 'Av. das Indústrias, 1400',
  bairro: 'Bairro Centro',
  cidade: 'Belo Horizonte / MG',
  horario: 'Segunda a sexta, 8h às 18h. Sábado, 8h às 13h.',
  instagram: '@pontoauto',
  instagramLink: 'https://instagram.com/',
  anos: 12,
  entregues: 1847,
  nota: '4,9',
  avaliacoes: 312
};

const fotosDe = (nome) => ({
  foto: `assets/img/estoque/${nome}-800.webp`,
  fotoG: `assets/img/estoque/${nome}-1600.webp`
});

const HISTORICO_PADRAO = (dona, revisoes, extra) => [
  ['Procedência', dona],
  ['Laudo cautelar', 'Aprovado, sem apontamento'],
  ['Sinistro', 'Nenhum registro'],
  ['Revisões', revisoes],
  ['Chaves', '2 chaves originais'],
  extra
];

const ESTOQUE = [
  {
    id: 'velar-rdynamic-2022',
    marca: 'Land Rover',
    modelo: 'Range Rover Velar',
    versao: 'R-Dynamic SE 2.0 P250',
    ano: 2021, anoModelo: 2022, km: 38600,
    preco: 409900, precoDe: 429900,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'SUV',
    cor: 'Cinza', portas: 4, finais: 3,
    destaque: true, selo: 'Destaque da semana',
    ...fotosDe('velar'),
    galeria: ['assets/img/hero/hero-1600.webp'],
    resumo: 'O carro da abertura do site. R-Dynamic com teto panorâmico e som Meridian, todas as revisões feitas na rede.',
    opcionais: ['Teto panorâmico', 'Som Meridian', 'Painel Touch Pro Duo', 'Faróis Matrix LED', 'Suspensão a ar', 'Bancos elétricos com memória', 'Câmera 360', 'Rodas 20 polegadas'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '4 de 4 na rede', ['Garantia', 'Estendida até 06/2027'])
  },
  {
    id: 'ram-trx-2022',
    marca: 'RAM',
    modelo: '1500 TRX',
    versao: '6.2 V8 Supercharged 4x4',
    ano: 2022, anoModelo: 2022, km: 21400,
    preco: 689900, precoDe: null,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Picape',
    cor: 'Cinza', portas: 4, finais: 7,
    destaque: true, selo: '702 cv',
    ...fotosDe('ram'),
    galeria: ['assets/img/hero/ram-noite-1920.webp'],
    resumo: 'São 702 cavalos, suspensão Bilstein de competição e pneus de 35 polegadas. Uma das poucas rodando no Brasil, com toda a documentação de importação.',
    opcionais: ['Suspensão Bilstein Black Hawk', 'Pneus 35 polegadas', 'Teto solar panorâmico', 'Som Harman Kardon', 'Head-up display', 'Central de 12 polegadas', 'Bancos ventilados', 'Launch Control'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa jurídica', '3 de 3 na rede', ['Importação', 'Documentação completa'])
  },
  {
    id: 'hilux-srv-2021',
    marca: 'Toyota',
    modelo: 'Hilux',
    versao: 'SRV 2.8 TDI 4x4 Cabine Dupla',
    ano: 2021, anoModelo: 2022, km: 68400,
    preco: 244900, precoDe: 259900,
    cambio: 'Automático', combustivel: 'Diesel', carroceria: 'Picape',
    cor: 'Prata', portas: 4, finais: 3,
    destaque: true, selo: 'Única dona',
    ...fotosDe('hilux'),
    resumo: 'Picape de quem usa de verdade e cuida. Revisões em dia na concessionária, sem uso off-road pesado.',
    opcionais: ['Ar-condicionado digital', 'Central multimídia', 'Câmera de ré', 'Controle de tração', 'Bancos em couro', 'Sensor de estacionamento', 'Piloto automático', 'Faróis de LED'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '6 de 6 na concessionária', ['Manual', 'Original, com carimbos'])
  },
  {
    id: 'tiguan-rline-2023',
    marca: 'Volkswagen',
    modelo: 'Tiguan',
    versao: 'Allspace R-Line 250 TSI',
    ano: 2023, anoModelo: 2023, km: 28900,
    preco: 229900, precoDe: 239900,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'SUV',
    cor: 'Preto', portas: 4, finais: 1,
    destaque: true, selo: '7 lugares',
    ...fotosDe('tiguan'),
    resumo: 'SUV de sete lugares com a terceira fileira pouco usada. Garantia de fábrica ainda válida.',
    opcionais: ['7 lugares', 'Teto panorâmico', 'Painel digital', 'Piloto adaptativo', 'Faróis full LED', 'Rodas 19 polegadas', 'Porta-malas elétrico', 'Câmera 360'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '2 de 2 na concessionária', ['Garantia', 'De fábrica até 03/2028'])
  },
  {
    id: 'rav4-hybrid-2022',
    marca: 'Toyota',
    modelo: 'RAV4',
    versao: 'S Connect Hybrid AWD',
    ano: 2022, anoModelo: 2022, km: 52300,
    preco: 219900, precoDe: null,
    cambio: 'Automático', combustivel: 'Híbrido', carroceria: 'SUV',
    cor: 'Branco', portas: 4, finais: 5,
    destaque: false, selo: 'Híbrido',
    ...fotosDe('rav4'),
    resumo: 'Faz 17 km/l na cidade sem você mudar nada no jeito de dirigir. Bateria com garantia estendida.',
    opcionais: ['Tração integral', 'Painel digital', 'Piloto adaptativo', 'Faróis de LED', 'Câmera de ré', 'Sensor de ponto cego', 'Partida por botão', 'Ar digital duplo'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '3 de 3 na concessionária', ['Bateria', 'Garantia até 2030'])
  },
  {
    id: 'bmw-420i-2021',
    marca: 'BMW',
    modelo: '420i Gran Coupé', nomeCurto: '420i',
    versao: 'M Sport 2.0 Turbo',
    ano: 2021, anoModelo: 2021, km: 47800,
    preco: 239900, precoDe: 249900,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Sedan',
    cor: 'Azul', portas: 4, finais: 9,
    destaque: false, selo: null,
    ...fotosDe('bmw'),
    resumo: 'Quatro portas com caimento de cupê e pacote M Sport de fábrica. Rodou quase só estrada, por isso o motor está novo.',
    opcionais: ['Pacote M Sport', 'Teto solar', 'Bancos em couro', 'Painel digital', 'Piloto adaptativo', 'Faróis adaptativos', 'Som Harman Kardon', 'Rodas 18 polegadas'],
    historico: HISTORICO_PADRAO('Segunda dona, pessoa física', '4 de 4 na concessionária', ['Manual', 'Original, com carimbos'])
  },
  {
    id: 'audi-a3-2022',
    marca: 'Audi',
    modelo: 'A3 Sportback', nomeCurto: 'A3',
    versao: 'Performance Black 2.0 TFSI',
    ano: 2022, anoModelo: 2022, km: 33100,
    preco: 189900, precoDe: null,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Hatch',
    cor: 'Preto', portas: 4, finais: 4,
    destaque: false, selo: null,
    ...fotosDe('audi'),
    resumo: 'Pacote Black completo, rodas escurecidas e faróis Matrix. Baixa quilometragem para o ano.',
    opcionais: ['Pacote Black', 'Faróis Matrix LED', 'Virtual Cockpit', 'Bancos esportivos', 'Piloto adaptativo', 'Câmera de ré', 'Som premium', 'Rodas 18 polegadas'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '3 de 3 na concessionária', ['Garantia', 'Estendida até 09/2027'])
  },
  {
    id: 'mini-cooper-s-2020',
    marca: 'Mini',
    modelo: 'Cooper S', nomeCurto: 'Cooper',
    versao: '2.0 Turbo 5 portas',
    ano: 2020, anoModelo: 2020, km: 58600,
    preco: 149900, precoDe: null,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Hatch',
    cor: 'Laranja', portas: 4, finais: 6,
    destaque: false, selo: null,
    ...fotosDe('mini'),
    resumo: 'Cinco portas, então serve de carro de família sem deixar de ser Mini. Cor original de fábrica.',
    opcionais: ['Teto solar', 'Bancos em couro', 'Central multimídia', 'Faróis de LED', 'Rodas 17 polegadas', 'Piloto automático', 'Sensor de estacionamento', 'Modo esportivo'],
    historico: HISTORICO_PADRAO('Segunda dona, pessoa física', '5 de 6 na concessionária', ['Manual', 'Original, com carimbos'])
  },
  {
    id: 'golf-gti-2019',
    marca: 'Volkswagen',
    modelo: 'Golf',
    versao: 'GTI 2.0 TSI DSG',
    ano: 2019, anoModelo: 2019, km: 72900,
    preco: 139900, precoDe: 145900,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Hatch',
    cor: 'Preto', portas: 4, finais: 8,
    destaque: false, selo: null,
    ...fotosDe('golf'),
    resumo: 'GTI de colecionador em estado de zero. Documentação limpa e histórico inteiro de manutenção com a gente.',
    opcionais: ['Bancos esportivos', 'Painel digital', 'Faróis full LED', 'Som Dynaudio', 'Rodas 18 polegadas', 'Piloto adaptativo', 'Câmera de ré', 'Modo esportivo'],
    historico: HISTORICO_PADRAO('Segunda dona, pessoa física', '7 de 7 na concessionária', ['Embreagem', 'Trocada em 2025, com nota'])
  },
  {
    id: 'compass-longitude-2021',
    marca: 'Jeep',
    modelo: 'Compass',
    versao: 'Longitude 2.0 Flex',
    ano: 2020, anoModelo: 2021, km: 54300,
    preco: 104900, precoDe: 109900,
    cambio: 'Automático', combustivel: 'Flex', carroceria: 'SUV',
    cor: 'Vermelho', portas: 4, finais: 6,
    destaque: false, selo: 'Entrada baixa',
    ...fotosDe('compass'),
    resumo: 'O SUV mais vendido do Brasil na versão que mais equilibra preço e equipamento. Pneus novos e revisão dos 50 mil feita.',
    opcionais: ['Central multimídia 8,4 polegadas', 'Câmera de ré', 'Piloto automático', 'Faróis de LED', 'Rodas de liga 18', 'Ar digital dual zone', 'Partida por botão', 'Sensor de estacionamento'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '5 de 5 na concessionária', ['Pneus', 'Os 4 trocados em 2026'])
  },
  {
    id: 'creta-prestige-2020',
    marca: 'Hyundai',
    modelo: 'Creta',
    versao: 'Prestige 2.0 Flex',
    ano: 2019, anoModelo: 2020, km: 61200,
    preco: 92900, precoDe: null,
    cambio: 'Automático', combustivel: 'Flex', carroceria: 'SUV',
    cor: 'Vermelho', portas: 4, finais: 2,
    destaque: false, selo: 'Única dona',
    ...fotosDe('creta'),
    resumo: 'Topo de linha do Creta, com teto solar e bancos em couro. Uma dona só, todas as revisões na concessionária.',
    opcionais: ['Teto solar', 'Bancos em couro', 'Central multimídia', 'Câmera de ré', 'Piloto automático', 'Chave presencial', 'Rodas de liga 17', 'Ar digital'],
    historico: HISTORICO_PADRAO('Primeira dona, pessoa física', '6 de 6 na concessionária', ['Pintura', 'Original nas 11 peças medidas'])
  },
  {
    id: 'fusion-sel-2017',
    marca: 'Ford',
    modelo: 'Fusion',
    versao: 'SEL 2.0 EcoBoost',
    ano: 2017, anoModelo: 2017, km: 94200,
    preco: 79900, precoDe: null,
    cambio: 'Automático', combustivel: 'Gasolina', carroceria: 'Sedan',
    cor: 'Prata', portas: 4, finais: 5,
    destaque: false, selo: 'Melhor preço',
    ...fotosDe('fusion'),
    resumo: 'Sedan grande, completo e barato. É o carro de quem quer espaço e conforto sem pagar por marca premium.',
    opcionais: ['Bancos em couro', 'Teto solar', 'Central SYNC', 'Câmera de ré', 'Piloto automático', 'Ar digital duplo', 'Rodas de liga 18', 'Sensor de estacionamento'],
    historico: HISTORICO_PADRAO('Terceira dona, pessoa física', 'Histórico parcial', ['Correia', 'Trocada em 2025, com nota'])
  }
];

/* Fotos de interior usadas na galeria da página de veículo. Num site de
   cliente cada carro tem as suas; aqui o mesmo conjunto atende todos.
   Só foto sem marca à vista: a de volante com logo da Infiniti saiu. Carro
   que tem foto própria além da de estúdio lista em `galeria` (Velar, RAM). */
const GALERIA_EXTRA = [
  'assets/img/estoque/int-2.webp',
  'assets/img/estoque/int-3.webp'
];

const ENTREGAS = [
  { foto: 'assets/img/entregas/01.webp', nome: 'Rafael e Camila', carro: 'Compass Longitude', texto: 'Procuramos em seis lojas antes. A diferença aqui foi o laudo na mesa antes da gente pedir.' },
  { foto: 'assets/img/entregas/02.webp', nome: 'Juliana Prado', carro: 'Golf GTI', texto: 'Comprei sem ir na loja, só por vídeo e WhatsApp. Chegou exatamente como mostraram.' },
  { foto: 'assets/img/entregas/03.webp', nome: 'Bruno Azevedo', carro: 'Hilux SRV 4x4', texto: 'Dei meu carro na troca e a avaliação veio acima do que eu esperava. Fechei no mesmo dia.' },
  { foto: 'assets/img/entregas/04.webp', nome: 'Larissa e Diego', carro: 'Creta Prestige', texto: 'Primeiro carro financiado da gente. Explicaram parcela por parcela, sem enrolar.' },
  { foto: 'assets/img/entregas/05.webp', nome: 'Marcos Teixeira', carro: 'Fusion SEL', texto: 'Levei meu mecânico junto na vistoria. Ele não achou nada para reclamar.' }
];

/* ---------- utilidades usadas em todas as páginas ---------- */

const fmtPreco = (v) => 'R$ ' + v.toLocaleString('pt-BR');
const fmtKm = (v) => v.toLocaleString('pt-BR') + ' km';

function linkZap(texto) {
  return 'https://wa.me/' + LOJA.whatsapp + '?text=' + encodeURIComponent(texto);
}

/* Frase sem artigo antes do carro de propósito: "o Hilux" e "o RAM" soam
   errado para quem vende ("a Hilux", "a RAM"), e o gênero muda por modelo. */
function zapCarro(c) {
  return linkZap(`Olá! Vi no site: ${c.marca} ${c.modelo} ${c.versao}, ${c.ano}/${c.anoModelo}, por ${fmtPreco(c.preco)}. Queria mais informações.`);
}

function carroPorId(id) {
  return ESTOQUE.find((c) => c.id === id) || null;
}

/* ---------- o painel manda no estoque do site (demonstração) ----------
   O que o lojista faz no painel (painel.html) fica salvo neste navegador e
   o site obedece: preço editado muda na vitrine, carro vendido ou excluído
   some, carro cadastrado aparece. Num cliente de verdade isso vem do banco.
   O painel carrega este arquivo com window.PAINEL = true e aplica sozinho. */
const ESTOQUE_BASE = ESTOQUE.slice();
(function aplicarPainel() {
  if (window.PAINEL) return;
  const ler = (k, p) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? p : v; } catch (e) { return p; } };
  const edicoes = ler('pa-painel-edicoes', {});
  const situacao = ler('pa-painel-situacao', {});
  const removidos = ler('pa-painel-removidos', []);
  const extras = ler('pa-painel-carros', []).map((c) => Object.assign({
    fotoG: c.foto, resumo: 'Recém-chegado. Fotos e laudo completos em breve.', opcionais: [], historico: [],
    anoModelo: c.ano, cor: '', portas: 4, finais: 0, precoDe: null, selo: 'Novo no estoque', destaque: false
  }, c));
  const lista = ESTOQUE.concat(extras)
    .map((c) => Object.assign({}, c, edicoes[c.id] || {}))
    .filter((c) => !removidos.includes(c.id) && situacao[c.id] !== 'Vendido')
    .map((c) => situacao[c.id] === 'Reservado' ? Object.assign(c, { selo: 'Reservado' }) : c);
  ESTOQUE.length = 0;
  lista.forEach((c) => ESTOQUE.push(c));
})();

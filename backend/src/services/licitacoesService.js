// Serviço de orquestração: é a peça que transforma N chamadas independentes à API do PNCP
// (uma por palavra-chave) em uma única lista de licitações, sem duplicatas, filtrada e paginada.
const { buscarPorPalavraChave } = require('./pncpClient');
const { normalizarLicitacao } = require('../utils/normalize');
const { cache, montarChaveCache } = require('../utils/cache');
const { pncpMaxPaginasPorPalavra, pncpTamanhoPaginaUpstream } = require('../config/env');

/**
 * Busca todas as páginas (até o limite configurado) de uma palavra-chave no PNCP.
 * Para de buscar mais páginas assim que uma página vier com menos itens que o solicitado,
 * pois isso indica que não há mais resultados adiante.
 */
async function buscarTodasPaginasDaPalavra(palavraChave) {
  const licitacoes = [];
  for (let pagina = 1; pagina <= pncpMaxPaginasPorPalavra; pagina += 1) {
    // eslint-disable-next-line no-await-in-loop -- páginas de uma mesma palavra são sequenciais por natureza (paginação)
    const { items } = await buscarPorPalavraChave(palavraChave, pagina, pncpTamanhoPaginaUpstream);
    items.forEach((item) => licitacoes.push(normalizarLicitacao(item, palavraChave)));
    if (items.length < pncpTamanhoPaginaUpstream) break;
  }
  return licitacoes;
}

/**
 * Aplica os filtros de Estado (UF) e período sobre a lista já normalizada.
 * Esses filtros são aplicados aqui no backend (e não repassados à API do PNCP) porque
 * o endpoint de busca do PNCP não garante, de forma confiável, o filtro server-side
 * por UF/data — então filtramos localmente sobre o conjunto de resultados obtido.
 */
function aplicarFiltros(licitacoes, { uf, dataInicial, dataFinal }) {
  return licitacoes.filter((licitacao) => {
    if (uf && licitacao.uf !== uf) return false;

    if ((dataInicial || dataFinal) && licitacao.dataPublicacao) {
      const dataPub = licitacao.dataPublicacao.slice(0, 10); // "AAAA-MM-DD"
      if (dataInicial && dataPub < dataInicial) return false;
      if (dataFinal && dataPub > dataFinal) return false;
    }

    return true;
  });
}

/** Remove licitações duplicadas (mesma licitação encontrada por palavras-chave diferentes). */
function removerDuplicadas(licitacoes) {
  const vistos = new Set();
  const unicas = [];
  for (const licitacao of licitacoes) {
    if (!vistos.has(licitacao.id)) {
      vistos.add(licitacao.id);
      unicas.push(licitacao);
    }
  }
  return unicas;
}

/**
 * Busca (com cache) o conjunto completo e já filtrado/deduplicado de licitações
 * para uma combinação de filtros. O resultado fica em cache por filtro (sem paginação),
 * permitindo que a navegação entre páginas não gere novas chamadas ao PNCP.
 */
async function obterConjuntoFiltrado(filtros) {
  const chaveCache = montarChaveCache(filtros);
  const emCache = cache.get(chaveCache);
  if (emCache) return emCache;

  const resultadosPorPalavra = await Promise.allSettled(
    filtros.palavrasChave.map((palavra) => buscarTodasPaginasDaPalavra(palavra)),
  );

  const licitacoes = [];
  const keywordsComErro = [];
  resultadosPorPalavra.forEach((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      licitacoes.push(...resultado.value);
    } else {
      keywordsComErro.push(filtros.palavrasChave[indice]);
    }
  });

  if (licitacoes.length === 0 && keywordsComErro.length === filtros.palavrasChave.length) {
    const erro = new Error('Não foi possível consultar o PNCP no momento. Tente novamente em instantes.');
    erro.status = 502;
    throw erro;
  }

  const unicas = removerDuplicadas(licitacoes);
  const filtradas = aplicarFiltros(unicas, filtros);
  filtradas.sort((a, b) => (b.dataPublicacao || '').localeCompare(a.dataPublicacao || ''));

  const conjunto = { licitacoes: filtradas, keywordsComErro };
  cache.set(chaveCache, conjunto);
  return conjunto;
}

/**
 * Ponto de entrada do serviço: aplica os filtros (com cache) e retorna a página solicitada.
 */
async function buscarLicitacoes(filtros) {
  const { licitacoes, keywordsComErro } = await obterConjuntoFiltrado(filtros);

  const totalRegistros = licitacoes.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / filtros.tamanhoPagina));
  const paginaAtual = Math.min(filtros.pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * filtros.tamanhoPagina;
  const resultados = licitacoes.slice(inicio, inicio + filtros.tamanhoPagina);

  return {
    pagina: paginaAtual,
    tamanhoPagina: filtros.tamanhoPagina,
    totalRegistros,
    totalPaginas,
    resultados,
    keywordsComErro,
  };
}

module.exports = { buscarLicitacoes };

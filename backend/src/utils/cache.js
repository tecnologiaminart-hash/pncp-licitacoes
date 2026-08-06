// Instância única (singleton) de cache em memória, compartilhada por toda a aplicação.
// Evita repetir buscas idênticas na API do PNCP dentro da janela de TTL configurada.
const NodeCache = require('node-cache');
const { cacheTtlSegundos } = require('../config/env');

const cache = new NodeCache({
  stdTTL: cacheTtlSegundos,
  checkperiod: Math.max(60, Math.floor(cacheTtlSegundos / 2)),
  useClones: false,
});

/**
 * Monta uma chave de cache estável para um conjunto de filtros de busca.
 * A ordenação das palavras-chave garante que a mesma combinação de filtros,
 * independente da ordem em que o usuário marcou os checkboxes, gere a mesma chave.
 * `ordenacao` fica de fora de propósito: a ordenação é aplicada em memória sobre o
 * conjunto já cacheado, então não precisa gerar uma entrada de cache separada.
 */
function montarChaveCache({ uf, modalidade, orgao, dataInicial, dataFinal, palavrasChave }) {
  const palavrasOrdenadas = [...palavrasChave].sort().join('|');
  const orgaoNormalizado = orgao ? orgao.toLowerCase() : 'sem-orgao';
  return [
    'licitacoes',
    uf || 'TODOS',
    modalidade || 'TODAS',
    orgaoNormalizado,
    dataInicial || 'sem-inicio',
    dataFinal || 'sem-fim',
    palavrasOrdenadas,
  ].join(':');
}

module.exports = { cache, montarChaveCache };

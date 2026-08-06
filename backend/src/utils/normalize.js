// Converte o formato "cru" retornado pela API de busca do PNCP para o formato
// enxuto que o frontend desta aplicação consome.
const { pncpAppUrl } = require('../config/env');

/**
 * @param {object} itemPncp Item retornado pela API de busca do PNCP.
 * @param {string} palavraChave Palavra-chave que originou esse resultado.
 */
function normalizarLicitacao(itemPncp, palavraChave) {
  return {
    id: itemPncp.numero_controle_pncp || itemPncp.id,
    titulo: itemPncp.title || 'Sem título informado',
    orgao: itemPncp.orgao_nome || 'Órgão não informado',
    uf: itemPncp.uf || '',
    municipio: itemPncp.municipio_nome || 'Não informado',
    dataPublicacao: itemPncp.data_publicacao_pncp || null,
    modalidade: itemPncp.modalidade_licitacao_nome || 'Não informada',
    objetoResumido: itemPncp.description || 'Objeto não informado',
    palavraChave,
    linkPncp: itemPncp.item_url ? `${pncpAppUrl}${itemPncp.item_url}` : pncpAppUrl,
  };
}

module.exports = { normalizarLicitacao };

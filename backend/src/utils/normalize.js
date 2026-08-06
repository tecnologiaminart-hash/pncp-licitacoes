// Converte o formato "cru" retornado pela API de busca do PNCP para o formato
// enxuto que o frontend desta aplicação consome.
const { pncpAppUrl } = require('../config/env');

/**
 * Monta o link público do edital no portal do PNCP.
 * A API de busca retorna `item_url` no formato "/compras/{cnpj}/{ano}/{sequencial}",
 * mas essa rota não exibe o conteúdo do edital no portal — a rota que efetivamente
 * funciona para editais é "/editais/{cnpj}/{ano}/{sequencial}". Por isso montamos o
 * link a partir dos campos crus (cnpj/ano/sequencial) em vez de usar item_url direto.
 */
function montarLinkPncp(itemPncp) {
  const { orgao_cnpj: cnpj, ano, numero_sequencial: sequencial } = itemPncp;
  if (cnpj && ano && sequencial) {
    return `${pncpAppUrl}/editais/${cnpj}/${ano}/${sequencial}`;
  }
  if (itemPncp.item_url) {
    return `${pncpAppUrl}${itemPncp.item_url.replace('/compras/', '/editais/')}`;
  }
  return pncpAppUrl;
}

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
    linkPncp: montarLinkPncp(itemPncp),
  };
}

module.exports = { normalizarLicitacao };

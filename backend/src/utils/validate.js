// Validação e normalização dos parâmetros recebidos pelo endpoint /api/licitacoes.
// Mantém a rota/controller enxutos e centraliza as regras de entrada em um só lugar.
const { UFS_VALIDAS, PALAVRAS_CHAVE_PADRAO } = require('../config/constants');

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

class ErroValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroValidacao';
    this.status = 400;
  }
}

function validarData(valor, nomeCampo) {
  if (!valor) return null;
  if (!REGEX_DATA.test(valor)) {
    throw new ErroValidacao(`${nomeCampo} deve estar no formato AAAA-MM-DD.`);
  }
  const data = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(data.getTime())) {
    throw new ErroValidacao(`${nomeCampo} não é uma data válida.`);
  }
  return valor;
}

/**
 * Lê e valida os query params da requisição, retornando um objeto de filtros pronto
 * para ser usado pelo serviço de busca. Lança ErroValidacao (400) em caso de entrada inválida.
 */
function validarFiltrosBusca(query) {
  const uf = query.uf ? String(query.uf).toUpperCase().trim() : '';
  if (uf && !UFS_VALIDAS.includes(uf)) {
    throw new ErroValidacao(`UF inválida: ${uf}.`);
  }

  const dataInicial = validarData(query.dataInicial, 'dataInicial');
  const dataFinal = validarData(query.dataFinal, 'dataFinal');
  if (dataInicial && dataFinal && dataInicial > dataFinal) {
    throw new ErroValidacao('dataInicial não pode ser posterior a dataFinal.');
  }

  const palavrasBrutas = query.palavrasChave
    ? String(query.palavrasChave).split(',').map((p) => p.trim()).filter(Boolean)
    : [];
  if (palavrasBrutas.length === 0) {
    throw new ErroValidacao('Selecione ao menos uma palavra-chave para pesquisar.');
  }
  const palavrasChave = palavrasBrutas.filter((p) => PALAVRAS_CHAVE_PADRAO.includes(p));
  if (palavrasChave.length === 0) {
    throw new ErroValidacao('Nenhuma das palavras-chave enviadas é reconhecida pelo sistema.');
  }

  const pagina = Math.max(1, Number(query.pagina) || 1);
  const tamanhoPagina = Math.min(50, Math.max(1, Number(query.tamanhoPagina) || 12));

  return { uf, dataInicial, dataFinal, palavrasChave, pagina, tamanhoPagina };
}

module.exports = { validarFiltrosBusca, ErroValidacao };

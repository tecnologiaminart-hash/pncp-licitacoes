// Validação e normalização dos parâmetros recebidos pelo endpoint /api/licitacoes.
// Mantém a rota/controller enxutos e centraliza as regras de entrada em um só lugar.
const { UFS_VALIDAS, MODALIDADES_CONTRATACAO, OPCOES_ORDENACAO } = require('../config/constants');

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const TAMANHO_MAX_PALAVRA_CHAVE = 80;
const TAMANHO_MAX_ORGAO = 120;
const MAX_PALAVRAS_CHAVE_POR_BUSCA = 15; // limite de sanidade: cada palavra dispara chamadas ao PNCP

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

  const modalidade = query.modalidade ? String(query.modalidade).trim() : '';
  if (modalidade && !MODALIDADES_CONTRATACAO.includes(modalidade)) {
    throw new ErroValidacao(`Modalidade inválida: ${modalidade}.`);
  }

  const orgao = query.orgao ? String(query.orgao).trim().slice(0, TAMANHO_MAX_ORGAO) : '';

  const ordenacao = query.ordenacao ? String(query.ordenacao).trim() : 'data_desc';
  if (!OPCOES_ORDENACAO.includes(ordenacao)) {
    throw new ErroValidacao(`Ordenação inválida: ${ordenacao}.`);
  }

  const dataInicial = validarData(query.dataInicial, 'dataInicial');
  const dataFinal = validarData(query.dataFinal, 'dataFinal');
  if (dataInicial && dataFinal && dataInicial > dataFinal) {
    throw new ErroValidacao('dataInicial não pode ser posterior a dataFinal.');
  }

  // Palavras-chave: o usuário pode remover as sugeridas e adicionar termos próprios,
  // então aqui só sanitizamos (tamanho, duplicatas) em vez de restringir a uma lista fixa.
  const palavrasBrutas = query.palavrasChave
    ? String(query.palavrasChave).split(',').map((p) => p.trim()).filter(Boolean)
    : [];
  if (palavrasBrutas.length === 0) {
    throw new ErroValidacao('Selecione ou informe ao menos uma palavra-chave para pesquisar.');
  }

  const vistas = new Set();
  const palavrasChave = [];
  for (const palavra of palavrasBrutas) {
    if (palavra.length > TAMANHO_MAX_PALAVRA_CHAVE) {
      throw new ErroValidacao(`Palavra-chave muito longa: "${palavra.slice(0, 30)}...".`);
    }
    const chaveDedupe = palavra.toLowerCase();
    if (!vistas.has(chaveDedupe)) {
      vistas.add(chaveDedupe);
      palavrasChave.push(palavra);
    }
  }
  if (palavrasChave.length > MAX_PALAVRAS_CHAVE_POR_BUSCA) {
    throw new ErroValidacao(`Selecione no máximo ${MAX_PALAVRAS_CHAVE_POR_BUSCA} palavras-chave por busca.`);
  }

  const pagina = Math.max(1, Number(query.pagina) || 1);
  const tamanhoPagina = Math.min(50, Math.max(1, Number(query.tamanhoPagina) || 12));

  return { uf, modalidade, orgao, ordenacao, dataInicial, dataFinal, palavrasChave, pagina, tamanhoPagina };
}

module.exports = { validarFiltrosBusca, ErroValidacao };

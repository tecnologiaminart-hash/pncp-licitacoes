// Controller HTTP: traduz requisição/resposta Express <-> serviço de domínio.
// Não contém regra de negócio — apenas validação de entrada e formatação de saída.
const { validarFiltrosBusca } = require('../utils/validate');
const { buscarLicitacoes } = require('../services/licitacoesService');

async function listarLicitacoes(req, res, next) {
  try {
    const filtros = validarFiltrosBusca(req.query);
    const resultado = await buscarLicitacoes(filtros);
    res.json(resultado);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { listarLicitacoes };

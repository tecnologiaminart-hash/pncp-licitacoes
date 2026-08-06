// Middleware central de tratamento de erros. Qualquer erro passado via next(erro)
// nas rotas cai aqui, garantindo um formato de resposta consistente para o frontend.
// eslint-disable-next-line no-unused-vars
function errorHandler(erro, req, res, next) {
  const status = erro.status || 500;
  if (status >= 500) {
    console.error('[erro]', erro);
  }
  res.status(status).json({
    erro: erro.message || 'Erro interno no servidor.',
  });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

module.exports = { errorHandler, rotaNaoEncontrada };

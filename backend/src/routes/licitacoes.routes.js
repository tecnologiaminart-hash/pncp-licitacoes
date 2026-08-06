// Definição das rotas relacionadas a licitações.
const { Router } = require('express');
const { listarLicitacoes } = require('../controllers/licitacoes.controller');

const router = Router();

// GET /api/licitacoes?uf=SP&dataInicial=2026-07-01&dataFinal=2026-08-05&palavrasChave=merenda escolar,medicamentos&pagina=1&tamanhoPagina=12
router.get('/licitacoes', listarLicitacoes);

module.exports = router;

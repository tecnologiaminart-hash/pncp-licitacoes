// Ponto de entrada da aplicação: sobe um único servidor Express que serve
// tanto a API (/api/*) quanto os arquivos estáticos do frontend (HTML/CSS/JS puro).
// Rodar tudo em um único servidor evita problemas de CORS entre frontend e backend.
const path = require('path');
const express = require('express');
const { port } = require('./src/config/env');
const licitacoesRoutes = require('./src/routes/licitacoes.routes');
const { errorHandler, rotaNaoEncontrada } = require('./src/middleware/errorHandler');

const app = express();

// Diretório do frontend (irmão da pasta backend/).
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND_DIR));
app.use('/api', licitacoesRoutes);

app.use('/api', rotaNaoEncontrada);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

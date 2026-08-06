# Busca de Licitações — PNCP

Sistema web completo (backend Node.js/Express + frontend HTML/CSS/JS puro) para
pesquisar licitações no **Portal Nacional de Contratações Públicas (PNCP)** por
Estado, período e múltiplas palavras-chave simultaneamente.

## Estrutura do projeto

```
.
├── backend/
│   ├── server.js                       # Ponto de entrada (Express)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   ├── env.js                  # Leitura das variáveis de ambiente
│       │   └── constants.js            # UFs válidas e palavras-chave padrão
│       ├── routes/
│       │   └── licitacoes.routes.js    # GET /api/licitacoes
│       ├── controllers/
│       │   └── licitacoes.controller.js
│       ├── services/
│       │   ├── pncpClient.js           # Chamada HTTP crua à API do PNCP
│       │   └── licitacoesService.js    # Busca simultânea, merge, dedupe, filtro, cache, paginação
│       ├── utils/
│       │   ├── cache.js                # Instância NodeCache + chave de cache
│       │   ├── normalize.js            # Normaliza item do PNCP -> formato da API própria
│       │   └── validate.js             # Validação dos filtros recebidos
│       └── middleware/
│           └── errorHandler.js
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css                   # Estilo inspirado em Material Design, responsivo
    └── js/
        ├── keywords.js                 # UFs e palavras-chave pré-selecionadas
        ├── api.js                      # Acesso à API própria (fetch)
        ├── ui.js                       # Manipulação do DOM
        └── main.js                     # Orquestração dos eventos da página
```

## Como a integração com o PNCP funciona

O backend consome o mesmo serviço de busca usado pelo próprio portal
(`https://pncp.gov.br/api/search/`), que é o que permite pesquisa textual por
palavra-chave (a API oficial documentada de consulta,
`/api/consulta/v1/contratacoes/publicacao`, não oferece busca por palavra-chave —
apenas filtros por data/modalidade/UF).

Fluxo de uma busca (`GET /api/licitacoes`):

1. O backend dispara, **em paralelo**, uma busca no PNCP para cada palavra-chave
   selecionada (até algumas páginas mais recentes por palavra, configurável).
2. Os resultados de todas as palavras-chave são **unidos**.
3. Licitações **duplicadas** (encontradas por mais de uma palavra-chave) são
   **eliminadas**, mantendo a palavra-chave que a encontrou primeiro.
4. Os filtros de **UF** e **período** são aplicados sobre o conjunto já unido —
   isso é feito no backend porque o endpoint de busca do PNCP não garante
   filtragem confiável desses campos do lado do servidor.
5. O resultado filtrado é ordenado por data de publicação (mais recentes primeiro),
   **armazenado em cache** (por combinação de filtros) e então paginado.

Por causa do passo 4, buscas por períodos muito antigos podem não trazer todos os
resultados existentes, já que o backend busca apenas as páginas mais recentes de
cada palavra-chave (limite configurável em `PNCP_MAX_PAGES_POR_PALAVRA`). Isso evita
sobrecarregar a API pública do PNCP com buscas muito amplas.

## Pré-requisitos

- Node.js 18 ou superior

## Como executar

```bash
cd backend
npm install
cp .env.example .env   # no Windows (PowerShell): copy .env.example .env
npm start
```

Acesse **http://localhost:3000** no navegador. O próprio backend serve os
arquivos do frontend (não é necessário nenhum outro servidor nem configurar CORS).

Para desenvolvimento com recarregamento automático ao salvar arquivos:

```bash
npm run dev
```

## Variáveis de ambiente (`backend/.env`)

| Variável                       | Descrição                                                          | Padrão                              |
|---------------------------------|----------------------------------------------------------------------|--------------------------------------|
| `PORT`                          | Porta do servidor Express                                            | `3000`                               |
| `PNCP_SEARCH_URL`                | URL do serviço de busca do PNCP                                      | `https://pncp.gov.br/api/search/`   |
| `PNCP_APP_URL`                   | URL base para montar o link oficial da licitação                     | `https://pncp.gov.br/app`           |
| `PNCP_TIMEOUT_MS`                | Timeout de cada requisição ao PNCP (ms)                               | `15000`                              |
| `PNCP_MAX_PAGES_POR_PALAVRA`     | Páginas mais recentes buscadas por palavra-chave                     | `3`                                   |
| `PNCP_TAMANHO_PAGINA_UPSTREAM`   | Itens por página solicitados ao PNCP                                  | `50`                                  |
| `CACHE_TTL_SEGUNDOS`             | Tempo de vida do cache de buscas                                      | `300`                                 |

## Endpoint da API própria

```
GET /api/licitacoes
```

| Parâmetro       | Obrigatório | Descrição                                              |
|-----------------|:-----------:|----------------------------------------------------------|
| `palavrasChave`  | sim         | Lista separada por vírgula. Aceita qualquer termo, não só os sugeridos (ex.: `Mesas,Cadeiras,ventilador industrial`) |
| `uf`             | não         | Sigla do estado (ex.: `SP`)                              |
| `modalidade`     | não         | Uma das modalidades da tabela de domínio do PNCP (ex.: `Pregão - Eletrônico`) |
| `orgao`          | não         | Busca parcial e tolerante a acentos no nome do órgão (ex.: `saude` encontra "SAÚDE") |
| `ordenacao`      | não         | `data_desc` (padrão), `data_asc`, `titulo_asc`, `titulo_desc`, `orgao_asc`, `orgao_desc` |
| `dataInicial`    | não         | `AAAA-MM-DD`                                              |
| `dataFinal`      | não         | `AAAA-MM-DD`                                               |
| `pagina`         | não         | Padrão `1`                                                 |
| `tamanhoPagina`  | não         | Padrão `12`, máximo `50`                                   |

Exemplo de resposta:

```json
{
  "pagina": 1,
  "tamanhoPagina": 12,
  "totalRegistros": 37,
  "totalPaginas": 4,
  "resultados": [
    {
      "id": "07954480000179-1-020079/2026",
      "titulo": "Pregão Eletrônico nº 202624275/2026",
      "orgao": "ESTADO DO CEARA",
      "uf": "CE",
      "municipio": "Itapiúna",
      "dataPublicacao": "2026-07-31T08:13:30.128413",
      "modalidade": "Pregão - Eletrônico",
      "objetoResumido": "AQUISIÇÃO DE MOBILIÁRIO ESCOLAR (MESAS E CADEIRAS) PARA...",
      "palavraChave": "Mesas",
      "linkPncp": "https://pncp.gov.br/app/editais/07954480000179/2026/20079"
    }
  ],
  "keywordsComErro": []
}
```

`keywordsComErro` lista as palavras-chave cuja consulta ao PNCP falhou (timeout,
instabilidade etc.), permitindo exibir os demais resultados normalmente com um aviso.

## Funcionalidades do frontend

- Filtro por Estado (UF), Modalidade da contratação, Órgão (busca parcial) e
  por período (data inicial/final).
- Ordenação dos resultados (mais recentes/antigas primeiro, título A-Z/Z-A,
  órgão A-Z/Z-A).
- Lista de palavras-chave pré-selecionadas em checkbox, todas marcadas por padrão.
  Cada uma pode ser desmarcada (não participa da busca) ou **removida** por completo
  (botão "×" no chip), e o usuário pode **adicionar** quantas palavras-chave próprias
  quiser pelo campo de texto abaixo da lista.
- Botão **Pesquisar** que envia apenas as palavras-chave marcadas no momento.
- Cartões de resultado (estilo Material Design) exibindo título, órgão, estado,
  município, data de publicação, modalidade, objeto resumido e a palavra-chave
  que gerou o resultado.
- Clique em qualquer cartão abre a página oficial da licitação no PNCP em uma
  nova aba (`target="_blank"` com `rel="noopener noreferrer"`).
- Indicador de carregamento durante a busca.
- Tratamento de erros de rede/servidor com mensagem amigável.
- Paginação dos resultados.
- Layout responsivo (grid adaptável, mobile-first nos breakpoints principais).

## Deploy gratuito (Render)

O GitHub por si só não executa o backend (só hospeda o código). Este projeto inclui
um `render.yaml` na raiz para subir o backend gratuitamente no [Render](https://render.com),
que serve tanto a API quanto o frontend estático a partir do mesmo serviço Node.

Passo a passo:

1. Crie uma conta em https://render.com e conecte sua conta do GitHub.
2. No painel do Render, clique em **New +** → **Blueprint**.
3. Selecione o repositório `pncp-licitacoes`. O Render vai detectar o `render.yaml`
   automaticamente e propor a criação do serviço `pncp-licitacoes` (plano `free`).
4. Confirme a criação. O Render já builda (`npm install`) e sobe (`npm start`)
   sozinho a cada novo `git push` na branch principal.
5. Ao final, você recebe uma URL pública do tipo `https://pncp-licitacoes.onrender.com`.

Observações do plano gratuito do Render: o serviço "dorme" após um período sem uso e
demora alguns segundos para acordar na primeira requisição seguinte — normal do free tier.

Se preferir outro provedor (Railway, Fly.io, um VPS, etc.), qualquer um que rode
Node.js 18+ funciona: basta configurar `rootDir`/diretório de trabalho como `backend/`,
comando de build `npm install` e comando de start `npm start`.

## Notas técnicas

- Sem frameworks no frontend: HTML + CSS + JavaScript puro (sem build step).
- Um único servidor Express serve API e frontend, eliminando a necessidade de CORS.
- Cache em memória (`node-cache`) evita repetir chamadas idênticas ao PNCP.
- Código dividido em camadas (rotas → controller → service → cliente HTTP) tanto
  no backend quanto no frontend (api → ui → main), facilitando manutenção e testes.

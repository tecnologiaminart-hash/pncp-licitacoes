# Pipeline de Licitações — PNCP

Sistema web 100% estático (HTML/CSS/JS puro, sem build step) para buscar licitações no
**Portal Nacional de Contratações Públicas (PNCP)** e acompanhar o pipeline comercial da
sua empresa: o que está em análise, propostas enviadas, contratos ganhos e itens
arquivados. Hospedado no **GitHub Pages**; dados de negócio (classificação, propostas,
contratos) persistidos no **Supabase** (Postgres + Auth), protegidos por login.

## Arquitetura

Não existe backend próprio. Duas integrações externas, ambas chamadas direto do navegador:

- **API de busca do PNCP** (`https://pncp.gov.br/api/search/`) — o mesmo serviço usado
  pelo próprio portal em `pncp.gov.br/app/editais`. Libera CORS para qualquer origem
  (`Access-Control-Allow-Origin: *`), por isso dá pra chamar direto do navegador sem
  precisar de um proxy.
- **Supabase** — Postgres + Auth. Guarda a classificação de cada licitação (em análise,
  proposta enviada, arquivada) e os dados de proposta/contrato. Protegido por Row Level
  Security: cada usuário só enxerga e altera as próprias linhas.

```
frontend/                    (publicado no GitHub Pages)
├── index.html                tela de login + app-shell (sidebar com 5 abas)
├── css/style.css
└── js/
    ├── keywords.js            UFs, modalidades, ordenação, situações, palavras-chave padrão
    ├── pncp/                  lógica de busca no PNCP (sem servidor)
    │   ├── cache.js             cache em memória (Map + TTL)
    │   ├── texto.js             busca de órgão tolerante a acento
    │   ├── situacao.js          classifica aberta/encerra hoje/encerrada (fuso Brasília)
    │   ├── normalize.js         formato cru do PNCP → formato usado no app
    │   ├── pncpClient.js        fetch() na API de busca do PNCP
    │   └── licitacoesService.js busca paralela por palavra-chave, dedupe, filtros, paginação
    ├── pipeline/              camada que fala com o Supabase
    │   ├── supabaseClient.js    cria o client (URL + anon key — ver "Configuração" abaixo)
    │   ├── auth.js               login / logout / sessão
    │   ├── motivos.js            motivos de arquivamento
    │   ├── pipelineRepository.js único módulo que lê/grava a tabela licitacoes_pipeline
    │   └── formularios.js        formulários dos modais (Enviar proposta / Editar contrato)
    ├── cards.js                componente de card único, reusado pelas 5 abas
    ├── modal.js                 modal genérico
    ├── toast.js                  aviso curto para falhas de escrita
    ├── ui.js                    painel de filtros da aba Buscar
    ├── shell.js                  gate de login + troca de aba da sidebar
    └── tabs/                   um módulo por aba (buscar, em-análise, propostas, contratos, arquivadas)
.github/workflows/deploy-pages.yml   publica frontend/ no GitHub Pages a cada push
```

## As 5 abas

1. **Buscar Licitações** — busca no PNCP com os filtros de sempre (UF, modalidade, órgão,
   período, situação, palavras-chave livres). Só mostra licitações **ainda não
   classificadas**. Ações em cada card: 👁️ Abrir no PNCP, ⭐ Salvar para analisar depois,
   ❌ Não atende, 📄 Enviado proposta (abre um formulário pedindo data e valor).
2. **Em análise** — o que foi salvo para decidir depois. Ações: abrir, enviar proposta,
   marcar como não atende.
3. **Propostas enviadas** — histórico permanente de tudo em que a empresa participou.
   Mostra data e valor da proposta; a situação (⏳ Aguardando / 🏆 Venceu / ❌ Não venceu /
   🚫 Cancelada) é alterável a qualquer momento e nunca arquiva o item sozinha.
4. **Contratos ganhos** — filtro automático das propostas com situação "Venceu". Tem uma
   ação **"Editar contrato"** para preencher valor, vigência, número do contrato, empenho
   e ordem de fornecimento (esses campos não têm outro lugar para serem preenchidos).
5. **Arquivadas** — tudo marcado como "não atende". Some da aba de busca. Botão
   **Restaurar** devolve o item para a busca (não apaga o histórico, só marca como
   "não classificado" de novo).

## Configuração (obrigatória antes de usar)

### 1. Criar o projeto no Supabase

Crie uma conta e um projeto em [supabase.com](https://supabase.com). No **SQL Editor** do
projeto, rode:

```sql
create table public.licitacoes_pipeline (
  id                            uuid primary key default gen_random_uuid(),
  usuario_id                    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  licitacao_id                  text not null,
  snapshot                      jsonb not null,
  status                        text not null check (status in
                                  ('em_analise','proposta_enviada','arquivada','restaurada')),
  motivo_arquivamento           text,
  data_proposta                 date,
  valor_proposta                numeric(14,2),
  situacao_proposta             text check (situacao_proposta in
                                  ('aguardando','venceu','nao_venceu','cancelada')),
  contrato_valor                numeric(14,2),
  contrato_vigencia_inicio      date,
  contrato_vigencia_fim         date,
  contrato_numero               text,
  contrato_empenho               text,
  contrato_ordem_fornecimento    text,
  criado_em                     timestamptz not null default now(),
  atualizado_em                  timestamptz not null default now(),
  unique (usuario_id, licitacao_id)
);

create index licitacoes_pipeline_usuario_status_idx
  on public.licitacoes_pipeline (usuario_id, status);

create function public.tg_licitacoes_pipeline_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_licitacoes_pipeline_atualizado_em
  before update on public.licitacoes_pipeline
  for each row execute function public.tg_licitacoes_pipeline_atualizado_em();

alter table public.licitacoes_pipeline enable row level security;

create policy "select_proprias_linhas" on public.licitacoes_pipeline
  for select using (auth.uid() = usuario_id);
create policy "insert_proprias_linhas" on public.licitacoes_pipeline
  for insert with check (auth.uid() = usuario_id);
create policy "update_proprias_linhas" on public.licitacoes_pipeline
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "delete_proprias_linhas" on public.licitacoes_pipeline
  for delete using (auth.uid() = usuario_id);
```

### 2. Criar seu usuário

Não existe tela de cadastro no app. Vá em **Authentication → Users → Add user** no
dashboard do Supabase e crie seu usuário (email + senha) manualmente.

Depois, em **Authentication → Providers → Email**, desative **"Allow new users to
sign up"** — defesa extra, já que a chave pública do projeto fica visível no código
(ver por quê abaixo).

### 3. Preencher as credenciais no código

Em **Settings → API**, copie a **Project URL** e a **anon public key**, e cole em
[`frontend/js/pipeline/supabaseClient.js`](frontend/js/pipeline/supabaseClient.js):

```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
```

Essas duas informações são **seguras para ficar públicas** no repositório — a chave
`anon` não concede acesso nenhum sozinha, é só um identificador do projeto. A segurança
de verdade está nas políticas de RLS do passo 1 (cada usuário só acessa as próprias
linhas).

### 4. Publicar no GitHub Pages

Já está configurado: o workflow [`deploy-pages.yml`](.github/workflows/deploy-pages.yml)
publica a pasta `frontend/` a cada push na branch `master`. Basta commitar as
credenciais do passo 3 e enviar.

## Rodando localmente

Como não há backend nem build step, basta servir a pasta `frontend/` com qualquer
servidor estático (não pode ser aberta como `file://` direto, porque módulos/CORS exigem
um servidor http real):

```bash
cd frontend
python -m http.server 8080
# ou: npx serve
```

Acesse `http://localhost:8080`.

## Notas técnicas / decisões

- **Sem paginação nas abas 2-5** — listas pessoais de pipeline tendem a ser pequenas; dá
  pra adicionar depois se necessário.
- **`motivo_arquivamento` é texto livre** (sem `check constraint` no banco) — a lista de
  motivos válidos vive só em `frontend/js/pipeline/motivos.js`, para adicionar um motivo
  novo não exigir migração de banco.
- **Todas as escritas no pipeline são upsert**, nunca insert puro — qualquer licitação
  pode já ter uma linha (inclusive com `status='restaurada'`).
- **Cada troca de aba busca de novo no Supabase** (sem cache entre abas) — mais simples
  que manter um estado compartilhado, e garante que uma reclassificação feita numa aba
  apareça nas outras imediatamente.
- Se a checagem de "já classificados" falhar (Supabase fora do ar), a aba Buscar **não
  trava** — mostra um aviso e segue exibindo a busca do PNCP sem esse filtro.
- O cache client-side (`pncp/cache.js`) e o limite de concorrência nas buscas por
  palavra-chave (`pncp/licitacoesService.js`) existem para não sobrecarregar a API
  pública do PNCP com tráfego repetido/paralelo demais.

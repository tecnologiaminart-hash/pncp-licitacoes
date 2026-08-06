// Única camada que fala com a tabela `licitacoes_pipeline` no Supabase.
// Todas as escritas são upsert (nunca INSERT puro): qualquer licitação pode já ter uma
// linha (inclusive com status='restaurada'), e a constraint unique(usuario_id, licitacao_id)
// exigiria tratar o conflito manualmente se usássemos insert simples.
//
// O upsert do PostgREST só altera, na linha existente, as colunas presentes no payload —
// colunas omitidas permanecem com o valor anterior. Por isso cada função abaixo manda
// explicitamente todos os campos que devem ficar preservados, mesmo quando o valor já
// estava lá, evitando depender demais desse comportamento implícito.
const PipelineRepository = (() => {
  const TABELA = 'licitacoes_pipeline';

  async function upsert(payload) {
    const { data, error } = await SupabaseClient
      .from(TABELA)
      .upsert(payload, { onConflict: 'usuario_id,licitacao_id' })
      .select()
      .single();
    if (error) throw new Error(`Não foi possível salvar: ${error.message}`);
    return data;
  }

  /**
   * Dado um conjunto de IDs de licitações (ex.: resultado de uma busca no PNCP), retorna
   * quais deles já têm alguma classificação ativa (qualquer status exceto 'restaurada').
   * Usado pela aba "Buscar Licitações" para esconder o que já foi classificado.
   */
  async function listarIdsClassificados(idsCandidatos) {
    if (!idsCandidatos || idsCandidatos.length === 0) return new Set();
    const { data, error } = await SupabaseClient
      .from(TABELA)
      .select('licitacao_id')
      .in('licitacao_id', idsCandidatos)
      .neq('status', 'restaurada');
    if (error) throw new Error(`Não foi possível verificar licitações já classificadas: ${error.message}`);
    return new Set(data.map((linha) => linha.licitacao_id));
  }

  async function listarPorStatus(status) {
    const { data, error } = await SupabaseClient
      .from(TABELA)
      .select('*')
      .eq('status', status)
      .order('atualizado_em', { ascending: false });
    if (error) throw new Error(`Não foi possível carregar a lista: ${error.message}`);
    return data;
  }

  async function listarContratosGanhos() {
    const { data, error } = await SupabaseClient
      .from(TABELA)
      .select('*')
      .eq('status', 'proposta_enviada')
      .eq('situacao_proposta', 'venceu')
      .order('atualizado_em', { ascending: false });
    if (error) throw new Error(`Não foi possível carregar os contratos ganhos: ${error.message}`);
    return data;
  }

  /** ⭐ Salvar para analisar depois. `licitacao` é o objeto normalizado vindo do PNCP. */
  function salvarParaAnalisar(licitacao) {
    return upsert({
      licitacao_id: licitacao.id,
      snapshot: licitacao,
      status: 'em_analise',
    });
  }

  /** ❌ Não atende. */
  function marcarNaoAtende(licitacao, motivo = 'nao_atende') {
    return upsert({
      licitacao_id: licitacao.id,
      snapshot: licitacao,
      status: 'arquivada',
      motivo_arquivamento: motivo,
    });
  }

  /** 📄 Enviado proposta. */
  function marcarPropostaEnviada(licitacao, { dataProposta, valorProposta }) {
    return upsert({
      licitacao_id: licitacao.id,
      snapshot: licitacao,
      status: 'proposta_enviada',
      situacao_proposta: 'aguardando',
      data_proposta: dataProposta,
      valor_proposta: valorProposta,
    });
  }

  /** Altera a situação de uma proposta já enviada (aguardando/venceu/nao_venceu/cancelada). */
  function atualizarSituacaoProposta(linha, situacaoProposta) {
    return upsert({
      licitacao_id: linha.licitacao_id,
      snapshot: linha.snapshot,
      status: 'proposta_enviada',
      situacao_proposta: situacaoProposta,
      data_proposta: linha.data_proposta,
      valor_proposta: linha.valor_proposta,
    });
  }

  /** Preenche/edita os dados de contrato de uma proposta vencedora. */
  function atualizarContrato(linha, dadosContrato) {
    return upsert({
      licitacao_id: linha.licitacao_id,
      snapshot: linha.snapshot,
      status: 'proposta_enviada',
      situacao_proposta: 'venceu',
      data_proposta: linha.data_proposta,
      valor_proposta: linha.valor_proposta,
      contrato_valor: dadosContrato.valor,
      contrato_vigencia_inicio: dadosContrato.vigenciaInicio,
      contrato_vigencia_fim: dadosContrato.vigenciaFim,
      contrato_numero: dadosContrato.numero,
      contrato_empenho: dadosContrato.empenho,
      contrato_ordem_fornecimento: dadosContrato.ordemFornecimento,
    });
  }

  /**
   * Restaurar (aba Arquivadas). Não apaga a linha — preserva motivo_arquivamento/criado_em
   * como histórico. status='restaurada' conta como "não classificado" para a aba de busca.
   */
  function restaurar(linha) {
    return upsert({
      licitacao_id: linha.licitacao_id,
      snapshot: linha.snapshot,
      status: 'restaurada',
    });
  }

  return {
    listarIdsClassificados,
    listarPorStatus,
    listarContratosGanhos,
    salvarParaAnalisar,
    marcarNaoAtende,
    marcarPropostaEnviada,
    atualizarSituacaoProposta,
    atualizarContrato,
    restaurar,
  };
})();

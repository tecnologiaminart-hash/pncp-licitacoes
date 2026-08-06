// Cache em memória (válido durante a sessão da aba), substitui o node-cache que existia
// no backend. Evita repetir buscas idênticas na API do PNCP dentro da janela de TTL.
const PncpCache = (() => {
  const TTL_MS = 5 * 60 * 1000; // 5 minutos, mesmo padrão do CACHE_TTL_SEGUNDOS do backend antigo
  const armazenamento = new Map();

  function get(chave) {
    const entrada = armazenamento.get(chave);
    if (!entrada) return undefined;
    if (Date.now() > entrada.expiraEm) {
      armazenamento.delete(chave);
      return undefined;
    }
    return entrada.valor;
  }

  function set(chave, valor) {
    armazenamento.set(chave, { valor, expiraEm: Date.now() + TTL_MS });
  }

  /**
   * Monta uma chave de cache estável para um conjunto de filtros de busca.
   * A ordenação das palavras-chave garante que a mesma combinação de filtros,
   * independente da ordem em que o usuário marcou os checkboxes, gere a mesma chave.
   */
  function montarChaveCache({ uf, modalidade, orgao, dataInicial, dataFinal, palavrasChave }) {
    const palavrasOrdenadas = [...palavrasChave].sort().join('|');
    const orgaoNormalizado = orgao ? orgao.toLowerCase() : 'sem-orgao';
    return [
      'licitacoes',
      uf || 'TODOS',
      modalidade || 'TODAS',
      orgaoNormalizado,
      dataInicial || 'sem-inicio',
      dataFinal || 'sem-fim',
      palavrasOrdenadas,
    ].join(':');
  }

  return { get, set, montarChaveCache };
})();

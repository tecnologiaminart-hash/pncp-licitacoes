// Camada de acesso à API própria do backend (não fala diretamente com o PNCP).
// Isola o restante do frontend de detalhes de fetch/URL/tratamento de erro HTTP.

const ApiLicitacoes = (() => {
  const BASE_URL = '/api/licitacoes';

  /**
   * @param {object} filtros { uf, dataInicial, dataFinal, palavrasChave, pagina, tamanhoPagina }
   * @returns {Promise<object>} resposta já em JSON
   */
  async function buscar(filtros) {
    const params = new URLSearchParams();
    if (filtros.uf) params.set('uf', filtros.uf);
    if (filtros.dataInicial) params.set('dataInicial', filtros.dataInicial);
    if (filtros.dataFinal) params.set('dataFinal', filtros.dataFinal);
    params.set('palavrasChave', filtros.palavrasChave.join(','));
    params.set('pagina', String(filtros.pagina));
    params.set('tamanhoPagina', String(filtros.tamanhoPagina));

    let resposta;
    try {
      resposta = await fetch(`${BASE_URL}?${params.toString()}`);
    } catch (erroRede) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }

    let corpo;
    try {
      corpo = await resposta.json();
    } catch (erroParse) {
      throw new Error('Resposta inesperada do servidor.');
    }

    if (!resposta.ok) {
      throw new Error(corpo.erro || `Erro ao consultar licitações (HTTP ${resposta.status}).`);
    }

    return corpo;
  }

  return { buscar };
})();

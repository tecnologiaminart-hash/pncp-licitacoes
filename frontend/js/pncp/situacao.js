// Classifica uma licitação como "aberta" (ainda aceitando propostas com folga),
// "encerra_hoje" ou "encerrada", a partir da data de fim do recebimento de propostas
// (data_fim_vigencia) retornada pelo PNCP.
//
// O PNCP publica esse horário sem indicação de fuso (ex.: "2026-08-05T09:00"), então
// tratamos o valor como horário local de Brasília. Calculamos o "agora" já convertido
// para o fuso America/Sao_Paulo e comparamos as strings diretamente (comparação
// lexicográfica funciona porque ambas seguem o formato AAAA-MM-DDTHH:mm:ss).
const PncpSituacao = (() => {
  function agoraNoBrasil() {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const valor = (tipo) => partes.find((p) => p.type === tipo).value;
    return `${valor('year')}-${valor('month')}-${valor('day')}T${valor('hour')}:${valor('minute')}:${valor('second')}`;
  }

  /**
   * @param {string|null} dataFimVigencia Ex.: "2026-08-05T09:00"
   * @param {string} agoraStr Instante atual no formato "AAAA-MM-DDTHH:mm:ss" (fuso de Brasília)
   * @returns {'aberta'|'encerra_hoje'|'encerrada'|null} null quando não há data para classificar
   */
  function classificarSituacao(dataFimVigencia, agoraStr) {
    if (!dataFimVigencia) return null;
    const fimStr = dataFimVigencia.slice(0, 19);
    if (fimStr < agoraStr) return 'encerrada';
    if (fimStr.slice(0, 10) === agoraStr.slice(0, 10)) return 'encerra_hoje';
    return 'aberta';
  }

  return { agoraNoBrasil, classificarSituacao };
})();

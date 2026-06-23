
/**
 * 
 * @param dataInicialStr - Data inicial do período 
 * @param dataFinalStr - Data de fim do período
 * @returns Quantidade absoluta de dias inteiros entre as duas datas
 */
export function calcularDiasAbsolutosUTC(dataInicialStr: string, dataFinalStr: string): number {
  if (!dataInicialStr || !dataFinalStr) {
    return 0;
  }

  // Divide as strings textuais eliminando qualquer interpretação do fuso horário local 
  const [anoInit, mesInit, diaInit] = dataInicialStr.split('-').map(num => parseInt(num, 10));
  const [anoFim, mesFim, diaFim] = dataFinalStr.split('-').map(num => parseInt(num, 10));

  //Cria os timestamps baseados no meridiano de Greenwich (UTC), onde todos os dias têm 24 horas
  const utcInicial = Date.UTC(anoInit, mesInit - 1, diaInit);
  const utcFinal = Date.UTC(anoFim, mesFim - 1, diaFim);

  const diferencaMs = utcFinal - utcInicial;

  // Conversão segura através de divisão inteira 
  return Math.max(0, Math.floor(diferencaMs / 86400000));

}





/** Converte "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Calcula as datas das parcelas duplicadas, respeitando "último dia do mês" */
export const calcularDatasParcelas = (dataInicialStr: string, numeroParcelas: number): string[] => {
  const datas: string[] = [];
  const [ano, mes, dia] = dataInicialStr.split('-').map(Number);
  const ultimoDiaMesAtual = new Date(ano, mes, 0).getDate();
  const isUltimoDia = dia === ultimoDiaMesAtual;

  for (let i = 1; i <= numeroParcelas; i++) {
    const proximoMes = mes - 1 + i;
    let proximoDia = dia;

    if (isUltimoDia) {
      proximoDia = new Date(ano, proximoMes + 1, 0).getDate();
    } else {
      const maxDiasMesAlvo = new Date(ano, proximoMes + 1, 0).getDate();
      if (proximoDia > maxDiasMesAlvo) {
        proximoDia = maxDiasMesAlvo;
      }
    }

    const novaData = new Date(ano, proximoMes, proximoDia);

    const anoFormatado = novaData.getFullYear();
    const mesFormatado = String(novaData.getMonth() + 1).padStart(2, '0');
    const diaFormatado = String(novaData.getDate()).padStart(2, '0');

    datas.push(`${anoFormatado}-${mesFormatado}-${diaFormatado}`);
  }

  return datas;
};

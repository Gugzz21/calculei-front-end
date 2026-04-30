/** Converte "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Calcula as datas das parcelas duplicadas, respeitando "último dia do mês" */
export const calcularDatasParcelas = (dataInicialStr: string, numeroParcelas: number): string[] => {
  const datas: string[] = [];
  // Formato recebido é 'YYYY-MM-DD'
  const [ano, mes, dia] = dataInicialStr.split('-').map(Number);

  // Descobre quantos dias tem o mês da data inicial
  const ultimoDiaMesAtual = new Date(ano, mes, 0).getDate();

  // Verifica se a data inicial é o último dia do mês
  const isUltimoDia = dia === ultimoDiaMesAtual;

  for (let i = 1; i <= numeroParcelas; i++) {
    const proximoMes = mes - 1 + i;
    let proximoDia = dia;

    if (isUltimoDia) {
      // Se era último dia, pega o último dia do mês alvo
      proximoDia = new Date(ano, proximoMes + 1, 0).getDate();
    } else {
      // Previne pular de mês (ex: 30 de Jan -> Fev só tem 28 ou 29 dias)
      const maxDiasMesAlvo = new Date(ano, proximoMes + 1, 0).getDate();
      if (proximoDia > maxDiasMesAlvo) {
        proximoDia = maxDiasMesAlvo;
      }
    }

    const novaData = new Date(ano, proximoMes, proximoDia);

    // Formata de volta para YYYY-MM-DD
    const anoFormatado = novaData.getFullYear();
    const mesFormatado = String(novaData.getMonth() + 1).padStart(2, '0');
    const diaFormatado = String(novaData.getDate()).padStart(2, '0');

    datas.push(`${anoFormatado}-${mesFormatado}-${diaFormatado}`);
  }

  return datas;
};

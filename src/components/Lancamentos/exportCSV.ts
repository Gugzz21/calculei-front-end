import type { LancamentoItem } from "../../types";
import { formatBRL, formatPercent } from "../../utils/formatters";
import { formatDate } from "../../utils/dateUtils";

export function exportarParaCSV(lancamentos: LancamentoItem[]) {
  if (!lancamentos || lancamentos.length === 0) return;

  const cabecalhos = [
    "Descrição",
    "Data Inicial",
    "Data Final",
    "Valor Original",
    "Índice",
    "Correção",
    "Valor Atualizado",
    "Tem Juros?",
    "Juros (%)",
    "Juros (R$)",
    "Total Devido",
  ];

  const linhas = lancamentos.map((item) => {
    return [
      `"${item.descricao}"`,
      `"${formatDate(item.dataInicial)}"`,
      `"${formatDate(item.dataCalculo)}"`,
      `"${formatBRL(item.valorPrincipal)}"`,
      `"${item.indiceCorrecao}"`,
      `"${formatPercent(item.percentualCorrecao)}"`,
      `"${formatBRL(item.valorAtualizado)}"`,
      `"${item.indiceJuros !== "—" ? "Sim" : "Não"}"`,
      `"${item.percentualJurosAcumulado ? formatPercent(item.percentualJurosAcumulado) : "0,00%"}"`,
      `"${formatBRL(item.juros)}"`,
      `"${formatBRL(item.total)}"`,
    ].join(";");
  });

  const csvContent = [cabecalhos.join(";"), ...linhas].join("\n");

  // Adicionar BOM para Excel ler caracteres acentuados corretamente em UTF-8
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `calculei_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

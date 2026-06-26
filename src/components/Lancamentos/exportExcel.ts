import ExcelJS from 'exceljs';
import type { LancamentoItem } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { gerarUUID, buildHistoricoPayload } from "../../utils/helpers";
import { salvarHistorico } from "../../services/api";

// ─── Paleta de cores (igual ao PDF) ──────────────────────────────────────────
const AZUL_HEADER = 'FF1F4E79';   // Azul escuro — cabeçalho da tabela
const AZUL_TITULO = 'FF073365';   // Azul mais escuro — título da aba
const AZUL_GRUPO = 'FFBDD2EB';  // Azul clarinho — linha de grupo (igual ao PDF)
const CINZA_TOTAL = 'FFF2F2F2';  // Cinza — coluna Total da linha de dados
const BRANCO = 'FFFFFFFF';
const PRETO = 'FF000000';

// ─── Helper: aplica estilo padrão a uma célula ────────────────────────────────
/*
 * Por que centralizar o estilo em uma função?
 *   Cada célula do ExcelJS precisa ter font, alignment, border e fill definidos
 *   individualmente. Um helper evita repetição e garante consistência visual.
 */
function estiloCelula(
  cell: ExcelJS.Cell,
  bold = false,
  fillArgb = BRANCO,
  fontArgb = PRETO,
  align: 'left' | 'center' | 'right' = 'center'
) {
  cell.font = { name: 'Arial', size: 9, bold, color: { argb: fontArgb } };
  cell.alignment = { vertical: 'middle', horizontal: align };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
}

// ─── Helper: borda de separação entre lançamentos ────────────────────────────
/*
 * Por que borda mais escura entre grupos?
 *   No PDF, o modelo separa visualmente cada lançamento com a linha de grupo
 *   colorida (AZUL_GRUPO). No Excel replicamos isso com border mais espessa
 *   na linha de grupo para dar o mesmo peso visual.
 */
function bordaGrupo(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'medium', color: { argb: AZUL_HEADER } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'medium', color: { argb: AZUL_HEADER } },
    right: { style: 'medium', color: { argb: AZUL_HEADER } },
  };
}

export async function exportarParaExcel(
  lancamentos: LancamentoItem[],
  ufirValue: number = 0,
  nomeInvestigado?: string
): Promise<{ token: string; blob: Blob; filename: string }> {
  if (!lancamentos || lancamentos.length === 0) throw new Error("Sem lançamentos para exportar.");

  const token = gerarUUID();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calculei App';
  workbook.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  // ABA 1 — Cálculo de Atualização Monetária (espelha a Tabela 1 do PDF)
  // ══════════════════════════════════════════════════════════════════════════
  const ws1 = workbook.addWorksheet('Atualização Monetária', { views: [{ showGridLines: false }] });

  // ── Larguras das colunas (definidas antes das linhas para aplicar antes do merge)
  ws1.columns = [
    { key: 'periodo', width: 28 },
    { key: 'valor', width: 18 },
    { key: 'indice', width: 32 },
    { key: 'correcao', width: 20 },
    { key: 'atualizado', width: 22 },
    { key: 'juros', width: 18 },
    { key: 'total', width: 22 },
  ];

  // ── Título da aba
  ws1.mergeCells('A1:G3');
  const title1 = ws1.getCell('A1');
  title1.value = nomeInvestigado
    ? `Relatório de Lançamentos — Cálculo de atualização monetária (Investigado: ${nomeInvestigado})`
    : 'Relatório de Lançamentos — Cálculo de atualização monetária';
  title1.font = { name: 'Arial', size: 13, bold: true, color: { argb: BRANCO } };
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_TITULO } };

  ws1.addRow([]); // linha de espaço entre título e cabeçalho

  // ── Cabeçalho da tabela (igual ao PDF — com "Fator de correção")
  const HEADERS1 = [
    'Período do cálculo',
    'Valor (R$)',
    'Índice',
    'Fator de correção',         // ← renomeado de "Correção" para alinhar com PDF
    'Valor atualizado (R$)',
    'Juros (R$)',
    'Total devido (R$)',
  ];
  const headerRow1 = ws1.addRow(HEADERS1);
  headerRow1.height = 22;
  headerRow1.eachCell(cell => estiloCelula(cell, true, AZUL_HEADER, BRANCO, 'center'));

  let rowIdx = 6;

  // ── Corpo: para cada lançamento → linha de grupo + linha de dados
  /*
   * Por que o mesmo padrão do PDF (grupo + dados)?
   *   O PDF usa uma linha colorida com o nome/número do lançamento como
   *   "cabeçalho" de cada grupo, seguida de uma linha de dados.
   *   Replicar esse padrão no Excel torna os dois documentos visualmente
   *   coerentes e facilita a comparação lado a lado.
   */
  lancamentos.forEach((l, idx) => {
    const numero = String(idx + 1);
    const nomeLancamento = `${numero} — ${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ''}`;

    // Linha de grupo (azul-claro, texto negrito — igual ao PDF)
    const groupRow = ws1.addRow([nomeLancamento]);
    ws1.mergeCells(`A${rowIdx}:G${rowIdx}`);
    groupRow.height = 18;
    const gc = groupRow.getCell(1);
    gc.value = nomeLancamento;
    gc.font = { name: 'Arial', size: 9, bold: true, color: { argb: PRETO } };
    gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_GRUPO } };
    gc.alignment = { vertical: 'middle', horizontal: 'left' };
    bordaGrupo(gc);
    rowIdx++;

    // Linha de dados
    const periodo = `${formatDate(l.dataInicial)} a ${formatDate(l.dataCalculo)}`;
    const dataRow = ws1.addRow([
      periodo,
      l.valorPrincipal,
      l.indiceCorrecao,
      (l.percentualCorrecao / 100) + 1,   // fator como decimal
      l.valorAtualizado,
      l.juros > 0 ? l.juros : '—',
      l.total,
    ]);
    dataRow.height = 18;
    dataRow.eachCell((cell, col) => {
      estiloCelula(cell, false, col === 7 ? CINZA_TOTAL : BRANCO, PRETO, 'center');
      if ([2, 5, 6, 7].includes(col) && typeof cell.value === 'number') {
        cell.numFmt = '"R$ "#,##0.00';
      }
      // Fator de correção com 8 casas decimais (igual ao PDF)
      if (col === 4) cell.numFmt = '0.00000000';
    });
    rowIdx++;
  });

  // ── Linha de Total (consolidada — igual ao bloco "Total" do PDF)
  /*
   * Por que uma única linha de Total aqui (não separada)?
   *   O PDF tem uma linha de Total dentro da tabela, sem blocos externos.
   *   Antes havia totais duplicados no Excel (Total na tabela + bloco UFIR
   *   separado). Agora o Total está integrado à tabela e o bloco UFIR vem
   *   logo depois, igual ao PDF.
   */
  const totPrincipal = lancamentos.reduce((s, l) => s + l.valorPrincipal, 0);
  const totAtualizado = lancamentos.reduce((s, l) => s + l.valorAtualizado, 0);
  const totJuros = lancamentos.reduce((s, l) => s + l.juros, 0);
  const totTotal = lancamentos.reduce((s, l) => s + l.total, 0);
  const temJuros = lancamentos.some(l => l.juros > 0);

  const totRow = ws1.addRow(['Total', totPrincipal, '', '', totAtualizado, temJuros ? totJuros : '—', totTotal]);
  totRow.height = 22;
  totRow.eachCell((cell, col) => {
    const isTotalCol = col === 7;
    estiloCelula(cell, true, isTotalCol ? CINZA_TOTAL : BRANCO, PRETO, col === 1 ? 'left' : 'center');
    if ([2, 5, 6, 7].includes(col) && typeof cell.value === 'number') {
      cell.numFmt = '"R$ "#,##0.00';
    }
  });
  rowIdx++;

  // ── Bloco UFIR (igual ao rodapé do PDF)
  ws1.addRow([]);
  rowIdx++;

  const ufirUnitStr = ufirValue > 0 ? ufirValue : 'Não disponível';
  const ufirInfoRow = ws1.addRow(['Valor unitário da UFIR utilizado:', '', '', '', '', '', ufirUnitStr]);
  ws1.mergeCells(`A${rowIdx}:F${rowIdx}`);
  ufirInfoRow.height = 22;

  // Células A–F do bloco UFIR (azul-claro, alinhado à direita)
  for (let i = 1; i <= 6; i++) {
    const c = ufirInfoRow.getCell(i);
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: AZUL_TITULO } };
    c.alignment = { vertical: 'middle', horizontal: 'right' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c.border = {
      top: { style: 'medium', color: { argb: AZUL_HEADER } },
      bottom: { style: 'medium', color: { argb: AZUL_HEADER } },
      left: { style: 'medium', color: { argb: AZUL_HEADER } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  }

  // Célula G do bloco UFIR (azul-escuro com texto branco — igual ao PDF)
  const ufirValCell = ws1.getCell(`G${rowIdx}`);
  ufirValCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: BRANCO } };
  ufirValCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ufirValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_HEADER } };
  if (typeof ufirValCell.value === 'number') ufirValCell.numFmt = '#,##0.0000';
  ufirValCell.border = {
    top: { style: 'medium', color: { argb: AZUL_HEADER } },
    bottom: { style: 'medium', color: { argb: AZUL_HEADER } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'medium', color: { argb: AZUL_HEADER } },
  };
  rowIdx++;

  // Linha "Total geral em UFIR" (azul-claro igual ao PDF)
  const totTotalGeral = lancamentos.reduce((s, l) => s + l.total, 0);
  const totalUfirVal = ufirValue > 0 ? totTotalGeral / ufirValue : null;

  const totUfirRow = ws1.addRow(['Total geral em UFIR']);
  ws1.mergeCells(`A${rowIdx}:F${rowIdx}`);
  totUfirRow.height = 22;

  for (let i = 1; i <= 6; i++) {
    const c = totUfirRow.getCell(i);
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: AZUL_TITULO } };
    c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'right' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c.border = {
      top: { style: 'medium', color: { argb: AZUL_HEADER } },
      bottom: { style: 'medium', color: { argb: AZUL_HEADER } },
      left: { style: 'medium', color: { argb: AZUL_HEADER } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  }

  const totUfirValCell = ws1.getCell(`G${rowIdx}`);
  totUfirValCell.value = totalUfirVal !== null ? totalUfirVal : '—';
  if (typeof totUfirValCell.value === 'number') totUfirValCell.numFmt = '#,##0.00';
  totUfirValCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: AZUL_TITULO } };
  totUfirValCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totUfirValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
  totUfirValCell.border = {
    top: { style: 'medium', color: { argb: AZUL_HEADER } },
    bottom: { style: 'medium', color: { argb: AZUL_HEADER } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'medium', color: { argb: AZUL_HEADER } },
  };
  rowIdx++;

  // ══════════════════════════════════════════════════════════════════════════
  // ABA 2 — Memória de Cálculo de Juros (somente se houver juros detalhados)
  // ══════════════════════════════════════════════════════════════════════════
  const lancamentosComJuros = lancamentos.filter(l => l.juros > 0);

  if (lancamentosComJuros.length > 0) {
    const ws2 = workbook.addWorksheet('Memória de Juros', { views: [{ showGridLines: false }] });

    ws2.columns = [
      { key: 'periodo', width: 34 },
      { key: 'atualizado', width: 22 },
      { key: 'dias', width: 12 },
      { key: 'fator', width: 18 },
      { key: 'acumulado', width: 18 },
      { key: 'juros', width: 22 },
    ];

    ws2.mergeCells('A1:F3');
    const title2 = ws2.getCell('A1');
    title2.value = nomeInvestigado
      ? `Relatório de Lançamentos — Memória de Cálculo de Juros (Investigado: ${nomeInvestigado})`
      : 'Relatório de Lançamentos — Memória de Cálculo de Juros';
    title2.font = { name: 'Arial', size: 13, bold: true, color: { argb: BRANCO } };
    title2.alignment = { vertical: 'middle', horizontal: 'center' };
    title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_TITULO } };

    ws2.addRow([]);

    const HEADERS2 = ['Período do cálculo', 'Valor atualizado (R$)', 'Dias', 'Fator (%)', 'Acumulado (%)', 'Juros (R$)'];
    const headerRow2 = ws2.addRow(HEADERS2);
    headerRow2.height = 22;
    headerRow2.eachCell(cell => estiloCelula(cell, true, AZUL_HEADER, BRANCO, 'center'));

    let rowIdx2 = 6;

    lancamentosComJuros.forEach((l, idx) => {
      const numero = String(idx + 1);
      const nomeLancamento = `${numero} — ${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ''}`;

      // Linha de grupo
      const groupRow = ws2.addRow([nomeLancamento]);
      ws2.mergeCells(`A${rowIdx2}:F${rowIdx2}`);
      groupRow.height = 20;
      const gc2 = groupRow.getCell(1);
      gc2.value = nomeLancamento;
      gc2.font = { name: 'Arial', size: 9, bold: true, color: { argb: PRETO } };
      gc2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_GRUPO } };
      gc2.alignment = { vertical: 'middle', horizontal: 'left' };
      bordaGrupo(gc2);
      rowIdx2++;

      let jurosAcum = 0;
      if (l.itensJuros && l.itensJuros.length > 0) {
        l.itensJuros.forEach((item) => {
          jurosAcum += item.valor;
          const subRow = ws2.addRow([
            `${formatDate(item.dataInicio)} a ${formatDate(item.dataFim)}`,
            l.valorAtualizado,
            item.dias,
            item.percentual / 100,
            jurosAcum / l.valorAtualizado,
            item.valor,
          ]);
          subRow.height = 18;
          subRow.eachCell((cell, col) => {
            estiloCelula(cell, false, BRANCO, PRETO, 'center');
            if ([2, 6].includes(col) && typeof cell.value === 'number') cell.numFmt = '"R$ "#,##0.00';
            if ([4, 5].includes(col) && typeof cell.value === 'number') cell.numFmt = '0.00000000%';
          });
          rowIdx2++;
        });
      } else {
        const periodo = l.dataInicioJuros
          ? `${formatDate(l.dataInicioJuros)} a ${formatDate(l.dataFimJuros!)}`
          : "—";
        const subRow = ws2.addRow([
          periodo,
          l.valorAtualizado,
          l.diasJuros ?? "—",
          l.fatorJuros != null ? l.fatorJuros : "—",
          l.percentualJurosAcumulado != null ? l.percentualJurosAcumulado / 100 : "—",
          l.juros,
        ]);
        subRow.height = 18;
        subRow.eachCell((cell, col) => {
          estiloCelula(cell, false, BRANCO, PRETO, 'center');
          if ([2, 6].includes(col) && typeof cell.value === 'number') cell.numFmt = '"R$ "#,##0.00';
          if ([4, 5].includes(col) && typeof cell.value === 'number') cell.numFmt = '0.00000000%';
        });
        rowIdx2++;
      }
    });

    // Total de juros
    const totalJuros = lancamentosComJuros.reduce((s, l) => s + l.juros, 0);
    const totJurosRow = ws2.addRow(['Total', '', '', '', '', totalJuros]);
    totJurosRow.height = 20;
    totJurosRow.eachCell((cell, col) => {
      estiloCelula(cell, true, col === 6 ? CINZA_TOTAL : BRANCO, PRETO, col === 1 ? 'left' : 'center');
      if (col === 6 && typeof cell.value === 'number') cell.numFmt = '"R$ "#,##0.00';
    });
  }

  // ── Finalizar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `calculei_export_${new Date().toISOString().split('T')[0]}.xlsx`;

  await salvarHistorico(buildHistoricoPayload(token, lancamentos));

  return { token, blob, filename };
}

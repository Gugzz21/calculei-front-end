import ExcelJS from 'exceljs';
import type { LancamentoItem } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { gerarUUID } from "../../utils/helpers";
import { salvarHistorico } from "../../services/api";

const AZUL_HEADER = 'FF1F4E79';
const AZUL_TITULO = 'FF073365';
const AZUL_GRUPO = 'FFDDE6F0';
const AZUL_UFIR = 'FFE6F0FA';
const CINZA_TOTAL = 'FFF2F2F2';
const BRANCO = 'FFFFFFFF';
const PRETO = 'FF000000';

function dataCellStyle(cell: ExcelJS.Cell, bold = false, fillArgb = BRANCO, fontArgb = PRETO, align: 'left' | 'center' | 'right' = 'center') {
  cell.font = { name: 'Arial', size: 9, bold, color: { argb: fontArgb } };
  cell.alignment = { vertical: 'middle', horizontal: align };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
}

export async function exportarParaExcel(
  lancamentos: LancamentoItem[],
  ufirValue: number = 0
): Promise<{ token: string; blob: Blob; filename: string }> {
  if (!lancamentos || lancamentos.length === 0) throw new Error("Sem lançamentos para exportar.");

  const token = gerarUUID();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calculei App';
  workbook.created = new Date();

  // ════════════════════════════════════════════════════════════════════════════
  // ABA 1 — Cálculo de atualização monetária
  // ════════════════════════════════════════════════════════════════════════════
  const ws1 = workbook.addWorksheet('Atualização Monetária', { views: [{ showGridLines: false }] });

  // ── Título
  ws1.mergeCells('A1:H3');
  const title1 = ws1.getCell('A1');
  title1.value = 'Relatório de Lançamentos - Cálculo de atualização monetária';
  title1.font = { name: 'Arial', size: 14, bold: true, color: { argb: BRANCO } };
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_TITULO } };

  ws1.addRow([]); // Espaço
  
  // ── Cabeçalho da Tabela
  const headers1 = ['#', 'Período de cálculo', 'Valor (R$)', 'Índice', 'Correção (%)', 'Valor atualizado (R$)', 'Juros (R$)', 'Total devido (R$)'];
  const headerRow1 = ws1.addRow(headers1);
  headerRow1.height = 25;
  headerRow1.eachCell(cell => dataCellStyle(cell, true, AZUL_HEADER, BRANCO, 'center'));

  // ── Larguras das Colunas
  ws1.columns = [
    { key: 'num', width: 8 },
    { key: 'periodo', width: 28 },
    { key: 'valor', width: 20 },
    { key: 'indice', width: 35 },
    { key: 'correcao', width: 18 },
    { key: 'atualizado', width: 22 },
    { key: 'juros', width: 20 },
    { key: 'total', width: 22 },
  ];

  let rowIdx = 6;

  lancamentos.forEach((l, idx) => {
    // Linha do Grupo
    const nomeLancamento = `${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`;
    const groupRow = ws1.addRow([nomeLancamento]);
    ws1.mergeCells(`A${rowIdx}:H${rowIdx}`);
    groupRow.height = 18;
    groupRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRETO } };
    groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_GRUPO } };
    groupRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    rowIdx++;

    // Linha de Dados
    const periodo = `${formatDate(l.dataInicial)} a ${formatDate(l.dataCalculo)}`;
    const dataRow = ws1.addRow([
      `${idx + 1})`,
      periodo,
      l.valorPrincipal,
      l.indiceCorrecao,
      l.percentualCorrecao / 100,
      l.valorAtualizado,
      l.juros > 0 ? l.juros : '—',
      l.total
    ]);
    
    dataRow.height = 18;
    dataRow.eachCell((cell, colNumber) => {
      let align: 'left'|'center'|'right' = 'right';
      if (colNumber === 1) align = 'center';
      if (colNumber === 2 || colNumber === 4) align = 'left';
      dataCellStyle(cell, false, BRANCO, PRETO, align);
      
      if ([3, 6, 7, 8].includes(colNumber) && typeof cell.value === 'number') {
        cell.numFmt = '"R$ "#,##0.00';
      }
      if (colNumber === 5) cell.numFmt = '0.00000000%';
    });
    rowIdx++;

    // Linha de Subtotal
    const subRow = ws1.addRow(['Total', '', l.valorPrincipal, '', '', l.valorAtualizado, l.juros > 0 ? l.juros : '—', l.total]);
    ws1.mergeCells(`A${rowIdx}:B${rowIdx}`);
    subRow.eachCell((cell, colNumber) => {
      let align: 'left'|'center'|'right' = 'right';
      if (colNumber === 1) align = 'left';
      dataCellStyle(cell, true, CINZA_TOTAL, PRETO, align);
      
      if ([3, 6, 7, 8].includes(colNumber) && typeof cell.value === 'number') {
        cell.numFmt = '"R$ "#,##0.00';
      }
    });
    rowIdx++;

    // Linha Total em UFIR
    const totalUfirVal = ufirValue > 0 ? l.total / ufirValue : null;
    const ufirRow = ws1.addRow(['Total em UFIR']);
    ws1.mergeCells(`A${rowIdx}:G${rowIdx}`);
    ufirRow.height = 20;
    ufirRow.eachCell(cell => {
      dataCellStyle(cell, true, AZUL_UFIR, AZUL_TITULO, 'left');
    });
    const ufirValCell = ws1.getCell(`H${rowIdx}`);
    ufirValCell.value = totalUfirVal !== null ? totalUfirVal : '—';
    if (typeof ufirValCell.value === 'number') ufirValCell.numFmt = '#,##0.00';
    dataCellStyle(ufirValCell, true, AZUL_UFIR, AZUL_TITULO, 'right');
    rowIdx++;
  });

  // Totais Gerais
  if (lancamentos.length > 1) {
    const totPrincipal = lancamentos.reduce((s, l) => s + l.valorPrincipal, 0);
    const totAtualizado = lancamentos.reduce((s, l) => s + l.valorAtualizado, 0);
    const totJuros = lancamentos.reduce((s, l) => s + l.juros, 0);
    const totTotal = lancamentos.reduce((s, l) => s + l.total, 0);
    const temJuros = lancamentos.some(l => l.juros > 0);

    const totRow = ws1.addRow(['TOTAL GERAL', '', totPrincipal, '', '', totAtualizado, temJuros ? totJuros : '—', totTotal]);
    ws1.mergeCells(`A${rowIdx}:B${rowIdx}`);
    ws1.mergeCells(`D${rowIdx}:E${rowIdx}`);

    totRow.height = 22;
    totRow.eachCell((cell, colNumber) => {
      let align: 'left'|'center'|'right' = 'right';
      if (colNumber === 1) align = 'left';
      dataCellStyle(cell, true, AZUL_HEADER, BRANCO, align);
      if ([3, 6, 7, 8].includes(colNumber) && typeof cell.value === 'number') {
        cell.numFmt = '"R$ "#,##0.00';
      }
    });
    rowIdx++;
  }

  // Bloco unitario UFIR
  ws1.addRow([]);
  rowIdx++;
  const ufirInfoRow = ws1.addRow(['Valor unitário da UFIR utilizado:', '', '', '', '', '', '', ufirValue > 0 ? ufirValue : 'Não disponível']);
  ws1.mergeCells(`A${rowIdx}:G${rowIdx}`);
  ufirInfoRow.height = 22;
  
  for (let i = 1; i <= 7; i++) {
    const cell = ufirInfoRow.getCell(i);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: AZUL_TITULO } };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_UFIR } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1F4E79' } },
      bottom: { style: 'medium', color: { argb: 'FF1F4E79' } },
      left: { style: 'medium', color: { argb: 'FF1F4E79' } },
      right: { style: 'medium', color: { argb: 'FF1F4E79' } },
    };
  }
  
  const ufirValInfoCell = ws1.getCell(`H${rowIdx}`);
  ufirValInfoCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: BRANCO } };
  ufirValInfoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ufirValInfoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_TITULO } };
  if (typeof ufirValInfoCell.value === 'number') ufirValInfoCell.numFmt = '#,##0.0000';
  ufirValInfoCell.border = {
    top: { style: 'medium', color: { argb: 'FF1F4E79' } },
    bottom: { style: 'medium', color: { argb: 'FF1F4E79' } },
    left: { style: 'medium', color: { argb: 'FF1F4E79' } },
    right: { style: 'medium', color: { argb: 'FF1F4E79' } },
  };
  rowIdx++;

  // Linha Total Geral em UFIR
  const totTotalGeral = lancamentos.reduce((s, l) => s + l.total, 0);
  const totalGeralUfirVal = ufirValue > 0 ? totTotalGeral / ufirValue : null;
  const totUfirRow = ws1.addRow(['TOTAL GERAL EM UFIR']);
  ws1.mergeCells(`A${rowIdx}:G${rowIdx}`);
  totUfirRow.height = 22;
  totUfirRow.eachCell((cell) => {
    dataCellStyle(cell, true, AZUL_UFIR, AZUL_TITULO, 'left');
  });
  const totUfirValCell = ws1.getCell(`H${rowIdx}`);
  totUfirValCell.value = totalGeralUfirVal !== null ? totalGeralUfirVal : '—';
  if (typeof totUfirValCell.value === 'number') totUfirValCell.numFmt = '#,##0.00';
  dataCellStyle(totUfirValCell, true, AZUL_UFIR, AZUL_TITULO, 'right');
  rowIdx++;


  // ════════════════════════════════════════════════════════════════════════════
  // ABA 2 — Memória de Cálculo de Juros (somente se houver juros)
  // ════════════════════════════════════════════════════════════════════════════
  const lancamentosComJuros = lancamentos.filter(l => l.juros > 0 && l.itensJuros && l.itensJuros.length > 0);
  
  if (lancamentosComJuros.length > 0) {
    const ws2 = workbook.addWorksheet('Memória de Juros', { views: [{ showGridLines: false }] });

    ws2.mergeCells('A1:G3');
    const title2 = ws2.getCell('A1');
    title2.value = 'Relatório de Lançamentos - Memória de Cálculo de Juros';
    title2.font = { name: 'Arial', size: 14, bold: true, color: { argb: BRANCO } };
    title2.alignment = { vertical: 'middle', horizontal: 'center' };
    title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_TITULO } };

    ws2.addRow([]);

    const headers2 = ['#', 'Período de cálculo', 'Valor atualizado (R$)', 'Dias', 'Fator (%)', 'Acumulado (%)', 'Juros (R$)'];
    const headerRow2 = ws2.addRow(headers2);
    headerRow2.height = 25;
    headerRow2.eachCell(cell => dataCellStyle(cell, true, AZUL_HEADER, BRANCO, 'center'));

    ws2.columns = [
      { key: 'num', width: 8 },
      { key: 'periodo', width: 32 },
      { key: 'atualizado', width: 24 },
      { key: 'dias', width: 15 },
      { key: 'fator', width: 18 },
      { key: 'acumulado', width: 20 },
      { key: 'juros', width: 22 },
    ];

    let rowIdx2 = 6;

    lancamentosComJuros.forEach((l, idx) => {
      const nomeLancamento = `${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`;
      const groupRow = ws2.addRow([nomeLancamento]);
      ws2.mergeCells(`A${rowIdx2}:G${rowIdx2}`);
      groupRow.height = 22;
      groupRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: PRETO } };
      groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL_GRUPO } };
      groupRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      rowIdx2++;

      let jurosAcumulados = 0;

      l.itensJuros?.forEach((item, jIdx) => {
        jurosAcumulados += item.valor;
        const subRow = ws2.addRow([
          `${idx + 1}.${jIdx + 1}`,
          `${formatDate(item.dataInicio)} a ${formatDate(item.dataFim)}`,
          l.valorAtualizado,
          item.dias,
          item.percentual / 100,
          jurosAcumulados / l.valorAtualizado, // Aproximação
          item.valor
        ]);
        
        subRow.height = 18;
        subRow.eachCell((cell, colNumber) => {
          let align: 'left'|'center'|'right' = 'right';
          if (colNumber === 1 || colNumber === 4) align = 'center';
          if (colNumber === 2) align = 'left';
          dataCellStyle(cell, false, BRANCO, PRETO, align);
          
          if ([3, 7].includes(colNumber) && typeof cell.value === 'number') {
            cell.numFmt = '"R$ "#,##0.00';
          }
          if ([5, 6].includes(colNumber) && typeof cell.value === 'number') {
            cell.numFmt = '0.00000000%';
          }
        });
        rowIdx2++;
      });

      // Total de juros do grupo
      const subTotalRow = ws2.addRow(['Total de Juros', '', '', '', '', '', l.juros]);
      ws2.mergeCells(`A${rowIdx2}:F${rowIdx2}`);
      subTotalRow.height = 20;
      subTotalRow.eachCell((cell, colNumber) => {
        let align: 'left'|'center'|'right' = 'right';
        if (colNumber === 1) align = 'left';
        dataCellStyle(cell, true, CINZA_TOTAL, PRETO, align);
        if (colNumber === 7 && typeof cell.value === 'number') {
          cell.numFmt = '"R$ "#,##0.00';
        }
      });
      rowIdx2++;
    });
  }

  // ── Finalizar Buffer e Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `calculei_export_${new Date().toISOString().split("T")[0]}.xlsx`;

  await salvarHistorico({
    data: new Date().toISOString().split("T")[0],
    token,
    json: {
      geradoEm: new Date().toISOString(),
      totalLancamentos: lancamentos.length,
      lancamentos: lancamentos,
    },
  });

  return { token, blob, filename };
}

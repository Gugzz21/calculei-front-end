import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { LancamentoItem } from '../../App';
import { formatDate } from '../../utils/dateUtils';


export async function exportarParaExcel(lancamentos: LancamentoItem[]) {
  if (!lancamentos || lancamentos.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Calculei App';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Lançamentos', {
    views: [{ showGridLines: false }],
  });

  // Estilos globais
  const titleFont = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const dataFont = { name: 'Arial', size: 10, color: { argb: 'FF333333' } };
  const currencyFormat = '"R$ "#,##0.00';
  const percentFormat = '0.00%';

  // Adiciona Título do Documento
  worksheet.mergeCells('A1:K2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Relatório de Lançamentos - Calculei';
  titleCell.font = titleFont;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF073365' },
  };

  // Linha em branco
  worksheet.addRow([]);

  // Definir largura das colunas (sem header para não sobrescrever o título)
  worksheet.columns = [
    { key: 'descricao', width: 35 },
    { key: 'dataInicial', width: 15 },
    { key: 'dataCalculo', width: 15 },
    { key: 'valorPrincipal', width: 18 },
    { key: 'indiceCorrecao', width: 20 },
    { key: 'percentualCorrecao', width: 15 },
    { key: 'valorAtualizado', width: 18 },
    { key: 'temJuros', width: 12 },
    { key: 'jurosPct', width: 15 },
    { key: 'jurosReais', width: 18 },
    { key: 'total', width: 20 },
  ];

  // Adicionar linha de cabeçalho manualmente (linha 4)
  const headerRow = worksheet.addRow([
    'Descrição',
    'Data Inicial',
    'Data Final',
    'Valor Original',
    'Índice Correção',
    'Correção',
    'Valor Atualizado',
    'Juros?',
    'Juros (%)',
    'Juros (R$)',
    'Total Devido',
  ]);

  // Estilizar a linha de cabeçalho
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      left: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      right: { style: 'thin', color: { argb: 'FFB0C4DE' } },
    };
  });

  // Adicionar Dados
  lancamentos.forEach((item, index) => {
    const isEven = index % 2 === 0;

    const dataInicialParts = formatDate(item.dataInicial).split('/');
    const dIni = new Date(parseInt(dataInicialParts[2]), parseInt(dataInicialParts[1]) - 1, parseInt(dataInicialParts[0]));

    const dataFinalParts = formatDate(item.dataCalculo).split('/');
    const dFin = new Date(parseInt(dataFinalParts[2]), parseInt(dataFinalParts[1]) - 1, parseInt(dataFinalParts[0]));

    const row = worksheet.addRow({
      descricao: item.descricao,
      dataInicial: dIni,
      dataCalculo: dFin,
      valorPrincipal: item.valorPrincipal,
      indiceCorrecao: item.indiceCorrecao,
      percentualCorrecao: item.percentualCorrecao / 100, // Excel espera decimal para %
      valorAtualizado: item.valorAtualizado,
      temJuros: item.indiceJuros !== "—" ? "Sim" : "Não",
      jurosPct: item.percentualJurosAcumulado ? item.percentualJurosAcumulado / 100 : 0,
      jurosReais: item.juros,
      total: item.total,
    });

    // Estilizar linha de dados
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = dataFont;
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'center' };

      // Cores alternadas tipo "Zebra"
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF2F6FC' : 'FFFFFFFF' },
      };

      // Bordas sutis
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Formatações numéricas
      if ([4, 7, 10, 11].includes(colNumber)) cell.numFmt = currencyFormat;
      if ([6, 9].includes(colNumber)) cell.numFmt = percentFormat;
      if ([2, 3].includes(colNumber)) cell.numFmt = 'dd/mm/yyyy';

      // Destacar a coluna "Total Devido"
      if (colNumber === 11) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF073365' } };
      }
    });
  });

  // Linha de totais no final
  const totalValor = lancamentos.reduce((acc, curr) => acc + curr.valorPrincipal, 0);
  const totalGeral = lancamentos.reduce((acc, curr) => acc + curr.total, 0);

  const summaryRow = worksheet.addRow({
    descricao: 'TOTAL GERAL',
    valorPrincipal: totalValor,
    total: totalGeral,
  });

  summaryRow.height = 25;
  summaryRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF073365' } };
    cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'right' : 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDE6F0' },
    };
    if ([4, 11].includes(colNumber)) {
      cell.numFmt = currencyFormat;
    }
  });

  // Mesclar células da linha de resumo
  worksheet.mergeCells(`A${summaryRow.number}:C${summaryRow.number}`);

  // Gerar o buffer e salvar o arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `calculei_export_${new Date().toISOString().split("T")[0]}.xlsx`;
  saveAs(blob, filename);
}

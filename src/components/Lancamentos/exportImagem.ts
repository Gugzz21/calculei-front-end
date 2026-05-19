import type { LancamentoItem } from "../../types";
import { gerarUUID } from "../../utils/helpers";
import { salvarHistorico } from "../../services/api";
import { toJpeg } from "html-to-image";

/**
 * Gera e baixa uma imagem JPEG da tabela de lançamentos usando html-to-image.
 * Também salva os dados no backend e retorna o token gerado.
 */
export async function baixarImagem(lancamentos: LancamentoItem[], element: HTMLElement | null): Promise<{ token: string, dataUrl: string } | null> {
  if (lancamentos.length === 0) {
    alert("Nenhum lançamento para exportar.");
    return null;
  }

  if (!element) {
    alert("Erro: Elemento da tabela não encontrado.");
    return null;
  }

  // ── Gera token ────────────────────────────────────────────────
  const token = gerarUUID();

  // ── Download da imagem com html-to-image ─────────────────────────────
  try {
    const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' });
    const downloadLink = document.createElement("a");
    downloadLink.download = "tabela-lancamentos.jpg";
    downloadLink.href = dataUrl;
    document.body.appendChild(downloadLink);

    // ── Salvar no backend ───────────────────────────────────────────────────────
    await salvarHistorico({
      data: new Date().toISOString().split("T")[0],
      token,
      json: {
        geradoEm: new Date().toISOString(),
        totalLancamentos: lancamentos.length,
        lancamentos: lancamentos.map((l) => ({
          id: l.id,
          descricao: l.descricao,
          dataInicial: l.dataInicial,
          dataCalculo: l.dataCalculo,
          valorPrincipal: l.valorPrincipal,
          indiceCorrecao: l.indiceCorrecao,
          valorAtualizado: l.valorAtualizado,
          dias: l.dias,
          percentualCorrecao: l.percentualCorrecao,
          indiceJuros: l.indiceJuros,
          dataInicioJuros: l.dataInicioJuros,
          dataFimJuros: l.dataFimJuros,
          diasJuros: l.diasJuros,
          fatorJuros: l.fatorJuros,
          percentualJurosAcumulado: l.percentualJurosAcumulado,
          juros: l.juros,
          total: l.total,
        })),
      },
    });

    return { token, dataUrl };
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    alert("Erro ao gerar imagem.");
    return null;
  }
}

import type { LancamentoItem } from "../../types";
import { gerarUUID, buildHistoricoPayload } from "../../utils/helpers";
import { salvarHistorico } from "../../services/api";
import { toJpeg } from "html-to-image";

/**
 * Gera apenas o DataUrl de um elemento
 */
export async function gerarImagemDataUrl(element: HTMLElement | null): Promise<string | null> {

  
  if (!element) return null;
  try {
    const filter = (node: HTMLElement) => !node.classList?.contains('exclude-from-print');
    return await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', filter, pixelRatio: 1 });
  } catch (error) {
    console.error("Erro ao gerar dataUrl da imagem:", error);
    return null;
  }
}

/**
 * Gera a imagem, salva no histórico (gerando token) e retorna token e dataUrl.
 */
export async function baixarImagem(lancamentos: LancamentoItem[], element: HTMLElement | null): Promise<{ token: string, dataUrl: string } | null> {
  if (lancamentos.length === 0) {
    alert("Nenhum lançamento para exportar.");
    return null;
  }
  console.time("Imagem");
  const dataUrl = await gerarImagemDataUrl(element);

  
  if (!dataUrl) {
    alert("Erro ao gerar imagem.");
    return null;
  }

  // ── Gera token ────────────────────────────────────────────────
  const token = gerarUUID();

  try {
    // ── Salvar no backend ───────────────────────────────────────────────────────
    await salvarHistorico(buildHistoricoPayload(token, lancamentos));

    return { token, dataUrl };
  } catch (error) {
    console.error("Erro ao salvar histórico da imagem:", error);
    alert("Erro ao salvar o histórico da imagem.");
    return null;
  }

  
}

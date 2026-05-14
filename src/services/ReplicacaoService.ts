import { CalculoService } from "./CalculoService";
import type { FormState, JurosState, LancamentoItem } from "../types";

/**
 * ReplicacaoService gerencia a lógica de duplicação em lote de parcelas.
 */
export const ReplicacaoService = {
  
  /** Tamanho do lote para requisições paralelas (otimizado para performance) */
  LOTE_SIZE: 15,

  /**
   * Duplica um lançamento base para múltiplas datas.
   */
  async replicar(
    origem: { form: FormState; juros: JurosState },
    novasDatas: string[],
    today: string
  ): Promise<{ resultados: LancamentoItem[]; origemMap: Record<number, { form: FormState; juros: JurosState }> }> {
    
    const novosResultados: LancamentoItem[] = [];
    const novoOrigemMap: Record<number, { form: FormState; juros: JurosState }> = {};

    for (let i = 0; i < novasDatas.length; i += this.LOTE_SIZE) {
      const lote = novasDatas.slice(i, i + this.LOTE_SIZE);

      const resultadosLote = await Promise.all(
        lote.map(async (data, indexNoLote) => {
          const formParaCalcular = { ...origem.form, dataInicial: data };
          const resultado = await CalculoService.calcular(formParaCalcular, origem.juros, today);
          
          return {
            resultado,
            formParaCalcular,
            indiceGlobal: i + indexNoLote,
          };
        })
      );

      for (const { resultado, formParaCalcular, indiceGlobal } of resultadosLote) {
        // Gera um ID único baseado no tempo + índice para evitar colisões no lote
        const novoId = Date.now() + indiceGlobal + Math.floor(Math.random() * 1000);
        
        const itemFinal = { ...resultado, id: novoId };
        novosResultados.push(itemFinal);
        novoOrigemMap[novoId] = { form: { ...formParaCalcular }, juros: { ...origem.juros } };
      }
    }

    return { resultados: novosResultados, origemMap: novoOrigemMap };
  }
};

import { calcularIndice, calcularJuros, getValorAtualizado, type CalcResponse } from "./api";
import type { FormState, JurosState, LancamentoItem, DetalheJuros } from "../types";
import { INDICE_LABEL, DESCRICAO_LABEL, JUROS_LABEL } from "../constants/dominios";

const INDICES_COM_JUROS_EMBUTIDOS = new Set(["selic"]);

/**
 * CalculoService isola a lógica de negócio de orquestração de cálculos
 * da infraestrutura de UI e hooks.
 */
export class CalculoService {

  /**
   * Executa o cálculo completo de um lançamento.
   */
  static async calcular(form: FormState, juros: JurosState, today: string): Promise<LancamentoItem> {
    this.validar(form, today);

    const valorBase = this.parseValor(form.valor);
    const respCorrecao = await calcularIndice(form.indiceCorrecao, {
      valor: valorBase,
      dateInit: form.dataInicial,
      dateFim: form.dataCalculo,
    });

    const valorAtualizado = respCorrecao ? getValorAtualizado(respCorrecao) : valorBase;
    const diasCorrecao = respCorrecao?.dias ?? 0;
    const percentualCorrecao = this.extrairPercentualCorrecao(respCorrecao, valorBase, valorAtualizado);

    const resultadoJuros = await this.processarJuros(juros, form.indiceCorrecao, valorAtualizado);

    return {
      id: Date.now(),
      tipoCalculo: form.tipoCalculo,
      descricao: DESCRICAO_LABEL[form.descricao] ?? form.descricao,
      descricaoComplementar: form.descricaoComplementar || undefined,
      dataInicial: form.dataInicial,
      valorPrincipal: valorBase,
      dataCalculo: form.dataCalculo,
      indiceCorrecao: INDICE_LABEL[form.indiceCorrecao] ?? form.indiceCorrecao,
      valorAtualizado,
      dias: diasCorrecao,
      percentualCorrecao,
      ...resultadoJuros,
      total: valorAtualizado + resultadoJuros.juros,
    };
  }

  /**
   * Validações de negócio.
   */
  static validar(form: FormState, today: string) {
    if (!this.parseValor(form.valor)) throw new Error("Informe o valor.");
    if (!form.dataInicial) throw new Error("Informe a data inicial.");
    if (!form.dataCalculo) throw new Error("Informe a data do cálculo.");
    if (form.dataCalculo > today) throw new Error("Data do cálculo não pode ser futura.");
    if (form.dataCalculo <= form.dataInicial) throw new Error("Data do cálculo deve ser posterior à data inicial.");
  }

  /**
   * Converte string monetária formatada para number.
   */
  static parseValor(valorStr: string): number {
    return valorStr ? parseInt(valorStr, 10) / 100 : 0;
  }

  /**
   * Extrai ou calcula o percentual de correção da resposta.
   */
  private static extrairPercentualCorrecao(resp: CalcResponse | null, valorBase: number, valorAtualizado: number): number {
    let pct = resp?.percentualAcumulado;
    if ((pct === undefined || pct === null) && valorBase > 0) {
      pct = ((valorAtualizado - valorBase) / valorBase) * 100;
    }
    return pct ?? 0;
  }

  /**
   * Processa a lista de períodos de juros.
   */
  private static async processarJuros(juros: JurosState, indiceCorrecao: string, valorBase: number) {
    const jurosEmbutidos = INDICES_COM_JUROS_EMBUTIDOS.has(indiceCorrecao);
    const deveAplicar = juros.enabled && !jurosEmbutidos && juros.aplicados.length > 0;

    let valorJurosTotal = 0;
    let percentualAcumulado = 0;
    let fatorAcumulado = 1;
    let diasTotais = 0;
    let label = "—";
    let dataIni = "";
    let dataFim = "";
    const itensJuros: DetalheJuros[] = [];

    if (deveAplicar) {
      const promessas = juros.aplicados.map(async (aplicado) => {
        if (aplicado.dataFim <= aplicado.dataInicio) return null;

        const resp = await calcularJuros(
          aplicado.indice,
          { valor: valorBase, dateInit: aplicado.dataInicio, dateFim: aplicado.dataFim },
          parseFloat(aplicado.taxa.replace(",", "."))
        );

        return { aplicado, resp };
      });

      const resultados = await Promise.all(promessas);

      for (const res of resultados) {
        if (!res || !res.resp) continue;
        const { aplicado, resp } = res;

        const valorPeriodo = getValorAtualizado(resp) - valorBase;
        valorJurosTotal += valorPeriodo;
        diasTotais += resp.dias ?? 0;
        fatorAcumulado *= (resp.fatorAcumulado ?? (1 + (resp.percentualAcumulado ?? 0) / 100));
        percentualAcumulado += resp.percentualAcumulado ?? 0;
        label = JUROS_LABEL[aplicado.indice] ?? aplicado.indice;
        dataIni = aplicado.dataInicio;
        dataFim = aplicado.dataFim;

        itensJuros.push({
          indice: JUROS_LABEL[aplicado.indice] ?? aplicado.indice,
          taxa: aplicado.taxa,
          dataInicio: aplicado.dataInicio,
          dataFim: aplicado.dataFim,
          dias: resp.dias ?? 0,
          percentual: resp.percentualAcumulado ?? 0,
          valor: valorPeriodo,
        });
      }
    }
    percentualAcumulado = (fatorAcumulado - 1) * 100;

    return {
      juros: valorJurosTotal,
      percentualJurosAcumulado: percentualAcumulado,
      fatorJuros: fatorAcumulado,
      diasJuros: diasTotais,
      indiceJuros: label,
      dataInicioJuros: dataIni,
      dataFimJuros: dataFim,
      itensJuros,
    };
  }

}

import { calcularIndice, calcularJuros, getValorAtualizado } from "./api";
import type { FormState, JurosState, LancamentoItem } from "../types";
import { INDICE_LABEL, DESCRICAO_LABEL, JUROS_LABEL } from "../constants/dominios";

const INDICES_COM_JUROS_EMBUTIDOS: string[] = ["selic", "tjrj119602009ipcaeselic"];

/**
 * Executa o cálculo completo (correção monetária + juros) e retorna
 * um LancamentoItem pronto para ser adicionado à lista.
 *
 * Lança Error com mensagem legível em caso de validação ou falha na API.
 */
export async function calcularLancamento(
  form: FormState,
  juros: JurosState,
  today: string
): Promise<LancamentoItem> {
  // ── Validações ───────────────────────────────────────────────────────────────
  const valorNum = form.valor ? parseInt(form.valor, 10) / 100 : 0;
  if (!valorNum)                              throw new Error("Informe o valor.");
  if (!form.dataInicial)                      throw new Error("Informe a data inicial.");
  if (!form.dataCalculo)                      throw new Error("Informe a data do cálculo.");
  if (form.dataCalculo > today)               throw new Error("Data do cálculo não pode ser futura.");
  if (form.dataCalculo <= form.dataInicial)   throw new Error("Data do cálculo deve ser posterior à data inicial.");

  // ── Correção Monetária ───────────────────────────────────────────────────────
  const respCorrecao = await calcularIndice(form.indiceCorrecao, {
    valor: valorNum,
    dateInit: form.dataInicial,
    dateFim: form.dataCalculo,
  });

  const valorAtualizado    = respCorrecao ? getValorAtualizado(respCorrecao) : valorNum;
  const dias               = respCorrecao?.dias ?? 0;

  // 🔍 LOG TEMPORÁRIO — ver todos os campos que o backend devolve
  console.log('[DEBUG] respCorrecao completo:', JSON.stringify(respCorrecao, null, 2));
  
  let percentualCorrecao = respCorrecao?.percentualAcumulado ?? respCorrecao?.fatorAcumulado;
  if (percentualCorrecao === undefined || percentualCorrecao === null || percentualCorrecao === 0) {
    percentualCorrecao = valorNum > 0 ? ((valorAtualizado - valorNum) / valorNum) * 100 : 0;
  }

  // ── Juros ────────────────────────────────────────────────────────────────────
  const selicSelecionada = INDICES_COM_JUROS_EMBUTIDOS.includes(form.indiceCorrecao);

  let valorJuros        = 0;
  let indiceJurosLabel  = "—";
  let dataInicioJuros   = "";
  let dataFimJuros      = "";
  let diasJuros         = 0;
  let fatorJuros        = 1;
  let percentualJuros   = 0;

  if (juros.enabled && !selicSelecionada && juros.aplicados.length > 0) {
    for (const aplicado of juros.aplicados) {
      if (aplicado.dataFim > aplicado.dataInicio) {
        const respJuros = await calcularJuros(
          aplicado.indice,
          {
            valor: valorAtualizado,
            dateInit: aplicado.dataInicio,
            dateFim: aplicado.dataFim,
          },
          parseFloat(aplicado.taxa.replace(",", "."))
        );
        if (respJuros) {
          valorJuros += getValorAtualizado(respJuros) - valorAtualizado;
          diasJuros += respJuros.dias || 0;
          if (respJuros.fatorAcumulado) {
            fatorJuros *= respJuros.fatorAcumulado;
          } else if (respJuros.percentualAcumulado) {
            fatorJuros *= (1 + respJuros.percentualAcumulado / 100);
          }
          percentualJuros += respJuros.percentualAcumulado || 0;
        }
        indiceJurosLabel = JUROS_LABEL[aplicado.indice] ?? aplicado.indice;
        dataInicioJuros  = aplicado.dataInicio;
        dataFimJuros     = aplicado.dataFim;
      }
    }
  }

  // ── Montagem do resultado ────────────────────────────────────────────────────
  return {
    id:               Date.now(),
    numero:           undefined,
    descricao:        DESCRICAO_LABEL[form.descricao] ?? form.descricao,
    dataInicial:      form.dataInicial,
    valorPrincipal:   valorNum,
    dataCalculo:      form.dataCalculo,
    indiceCorrecao:   INDICE_LABEL[form.indiceCorrecao] ?? form.indiceCorrecao,
    valorAtualizado,
    dias,
    percentualCorrecao,
    indiceJuros:      indiceJurosLabel,
    dataInicioJuros,
    dataFimJuros,
    diasJuros,
    fatorJuros,
    percentualJurosAcumulado: percentualJuros,
    juros:            valorJuros,
    total:            valorAtualizado + valorJuros,
  };
}

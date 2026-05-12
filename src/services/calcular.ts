// =============================================================================
// calcular.ts — Orquestração do cálculo completo de um lançamento
//
// Responsabilidade: combinar correção monetária + juros e montar o LancamentoItem.
// A lógica de comunicação com APIs fica em api.ts.
// =============================================================================

import { calcularIndice, calcularJuros, getValorAtualizado } from "./api";
import type { FormState, JurosState, LancamentoItem } from "../types";
import { INDICE_LABEL, DESCRICAO_LABEL, JUROS_LABEL } from "../constants/dominios";

/** Índices de correção que já embute juros (não aplicar juros separados) */
const INDICES_COM_JUROS_EMBUTIDOS = new Set(["selic", "tjrj119602009ipcaeselic"]);

/**
 * Executa o cálculo completo (correção monetária + juros) e retorna
 * um LancamentoItem pronto para ser adicionado à lista de lançamentos.
 *
 * @throws Error com mensagem legível em caso de validação ou falha na API.
 */
export async function calcularLancamento(
  form:  FormState,
  juros: JurosState,
  today: string
): Promise<LancamentoItem> {
  // ── Validações ───────────────────────────────────────────────────────────────

  const valorNum = form.valor ? parseInt(form.valor, 10) / 100 : 0;

  if (!valorNum)                             throw new Error("Informe o valor.");
  if (!form.dataInicial)                     throw new Error("Informe a data inicial.");
  if (!form.dataCalculo)                     throw new Error("Informe a data do cálculo.");
  if (form.dataCalculo > today)              throw new Error("Data do cálculo não pode ser futura.");
  if (form.dataCalculo <= form.dataInicial)  throw new Error("Data do cálculo deve ser posterior à data inicial.");

  // ── Correção Monetária ───────────────────────────────────────────────────────

  const respCorrecao = await calcularIndice(form.indiceCorrecao, {
    valor:    valorNum,
    dateInit: form.dataInicial,
    dateFim:  form.dataCalculo,
  });

  const valorAtualizado = respCorrecao ? getValorAtualizado(respCorrecao) : valorNum;
  const dias            = respCorrecao?.dias ?? 0;

  // Calcula o percentual de correção; se vier zerado, deriva da variação do valor
  let percentualCorrecao =
    respCorrecao?.percentualAcumulado ?? respCorrecao?.fatorAcumulado ?? respCorrecao?.accumulatedFactor;

  if (!percentualCorrecao && valorNum > 0) {
    percentualCorrecao = ((valorAtualizado - valorNum) / valorNum) * 100;
  }

  // ── Juros ────────────────────────────────────────────────────────────────────

  const jurosEmbutidosNoIndice = INDICES_COM_JUROS_EMBUTIDOS.has(form.indiceCorrecao);
  const deveAplicarJuros       = juros.enabled && !jurosEmbutidosNoIndice && juros.aplicados.length > 0;

  let valorJuros       = 0;
  let indiceJurosLabel = "—";
  let dataInicioJuros  = "";
  let dataFimJuros     = "";
  let diasJuros        = 0;
  let fatorJuros       = 1;
  let percentualJuros  = 0;

  if (deveAplicarJuros) {
    for (const aplicado of juros.aplicados) {
      // Ignora períodos invertidos (proteção defensiva)
      if (aplicado.dataFim <= aplicado.dataInicio) continue;

      const respJuros = await calcularJuros(
        aplicado.indice,
        {
          valor:    valorAtualizado,
          dateInit: aplicado.dataInicio,
          dateFim:  aplicado.dataFim,
        },
        parseFloat(aplicado.taxa.replace(",", "."))
      );

      if (!respJuros) continue;

      valorJuros += getValorAtualizado(respJuros) - valorAtualizado;
      diasJuros  += respJuros.dias ?? 0;

      // Acumula o fator de juros (usando o que estiver disponível na resposta)
      if (respJuros.fatorAcumulado) {
        fatorJuros *= respJuros.fatorAcumulado;
      } else if (respJuros.percentualAcumulado) {
        fatorJuros *= 1 + respJuros.percentualAcumulado / 100;
      }

      percentualJuros += respJuros.percentualAcumulado ?? respJuros.accumulatedFactor ?? 0;
      indiceJurosLabel = JUROS_LABEL[aplicado.indice] ?? aplicado.indice;
      dataInicioJuros  = aplicado.dataInicio;
      dataFimJuros     = aplicado.dataFim;
    }
  }

  // ── Montagem do LancamentoItem ────────────────────────────────────────────────

  return {
    id:                       Date.now(),
    numero:                   undefined,
    descricao:                DESCRICAO_LABEL[form.descricao] ?? form.descricao,
    dataInicial:              form.dataInicial,
    valorPrincipal:           valorNum,
    dataCalculo:              form.dataCalculo,
    indiceCorrecao:           INDICE_LABEL[form.indiceCorrecao] ?? form.indiceCorrecao,
    valorAtualizado,
    dias,
    percentualCorrecao:       percentualCorrecao ?? 0,
    indiceJuros:              indiceJurosLabel,
    dataInicioJuros,
    dataFimJuros,
    diasJuros,
    fatorJuros,
    percentualJurosAcumulado: percentualJuros,
    juros:                    valorJuros,
    total:                    valorAtualizado + valorJuros,
  };
}

// =============================================================================
// useIndices.ts — Carrega as listas de índices a partir do backend Java
//
// O backend expõe quais índices estão disponíveis via:
//   GET /index-name/monetary-correction  → lista de enums de correção monetária
//   GET /index-name/interest-correction  → lista de enums de juros
//
// Os enums Java são convertidos para os valores internos do frontend
// usando os mapas centralizados em dominios.ts.
// Em caso de falha na API, usa os labels de dominios.ts como fallback.
// =============================================================================

import { useState, useEffect } from "react";
import {
  INDICE_LABEL,
  JUROS_LABEL,
  MONETARY_CORRECTION_JAVA_MAP,
  INTEREST_CORRECTION_JAVA_MAP,
  TIPO_CALCULO_INDICE_EXCLUIDOS,
} from "../constants/dominios";

export interface IndiceOpcao {
  value: string;
  label: string;
}

// Opção fixa que o backend não retorna mas o frontend precisa exibir
const SEM_CORRECAO_OPCAO: IndiceOpcao = {
  value: "semcorrecaomonetaria",
  label: "SEM CORREÇÃO MONETÁRIA",
};

/**
 * Converte um array de enums Java para opções de select { value, label }.
 * Usa o mapa de conversão para traduzir o enum para o valor interno.
 * Ignora enums desconhecidos.
 */
function mapJavaEnumsToOpcoes(
  enums:     string[],
  javaMap:   Record<string, string>,
  labelMap:  Record<string, string>
): IndiceOpcao[] {
  return enums.flatMap((enumKey) => {
    const internalValue = javaMap[enumKey];
    if (!internalValue) return []; // enum desconhecido — ignorar
    return [{ value: internalValue, label: labelMap[internalValue] ?? enumKey }];
  });
}

/**
 * Hook que retorna as listas de índices de correção monetária e de juros
 * carregadas do backend Java, com fallback para as constantes locais.
 * Filtra automaticamente os índices excluídos para o tipo de cálculo informado.
 */
export function useIndices(tipoCalculo?: string) {
  const [indiceCorrecaoOpcoesBase, setIndiceCorrecaoOpcoesBase] = useState<IndiceOpcao[]>([]);
  const [jurosIndiceOpcoes,        setJurosIndiceOpcoes]        = useState<IndiceOpcao[]>([]);

  useEffect(() => {
    async function carregarIndices() {
      // ── Índices de Correção Monetária ──────────────────────────────────────
      try {
        const res  = await fetch("/api/index-name/monetary-correction");
        const data: string[] = await res.json();
        const opcoes = mapJavaEnumsToOpcoes(data, MONETARY_CORRECTION_JAVA_MAP, INDICE_LABEL);
        setIndiceCorrecaoOpcoesBase([...opcoes, SEM_CORRECAO_OPCAO]);
      } catch {
        // Fallback: todas as entradas do dicionário local
        const fallback = Object.entries(INDICE_LABEL).map(([value, label]) => ({ value, label }));
        setIndiceCorrecaoOpcoesBase([...fallback, SEM_CORRECAO_OPCAO]);
      }

      // ── Índices de Juros ───────────────────────────────────────────────────
      try {
        const res  = await fetch("/api/index-name/interest-correction");
        const data: string[] = await res.json();
        const opcoes = mapJavaEnumsToOpcoes(data, INTEREST_CORRECTION_JAVA_MAP, JUROS_LABEL);
        setJurosIndiceOpcoes(opcoes);
      } catch {
        // Fallback: todas as entradas do dicionário local
        const fallback = Object.entries(JUROS_LABEL).map(([value, label]) => ({ value, label }));
        setJurosIndiceOpcoes(fallback);
      }
    }

    carregarIndices();
  }, []);

  // Filtra os índices excluídos para o tipo de cálculo atual
  const excluidos = tipoCalculo ? (TIPO_CALCULO_INDICE_EXCLUIDOS[tipoCalculo] ?? []) : [];
  const indiceCorrecaoOpcoes = excluidos.length > 0
    ? indiceCorrecaoOpcoesBase.filter(op => !excluidos.includes(op.value))
    : indiceCorrecaoOpcoesBase;

  return { indiceCorrecaoOpcoes, jurosIndiceOpcoes };
}

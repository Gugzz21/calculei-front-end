/** Formata número como moeda BRL */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata percentual com 6 casas decimais */
export function formatPercent(value: number): string {
  return `${Number(value).toFixed(6)}%`;
}


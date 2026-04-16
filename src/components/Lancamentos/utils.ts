/** Formata número como moeda BRL */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Converte "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Formata percentual com 4 casas decimais */
export function formatPercent(value: number): string {
  return `${Number(value).toFixed(4)}%`;
}

/** Gera um UUID v4 simples sem dependência externa */
export function gerarUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

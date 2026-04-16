import { useState } from "react";
import MdPictureAsPdf from "@mui/icons-material/PictureAsPdf";
import { buscarPorToken } from "../../services/api";
import type { LancamentoItem } from "../../App";
import type { LancamentoRecuperado, DadosRecuperados } from "./types";
import { gerarPDFRecuperado } from "./exportPDF";
import { formatBRL, formatDate } from "./utils";

/** Extrai o array de lançamentos de qualquer forma que o backend retorne */
function extrairLancamentos(raw: object): LancamentoRecuperado[] {
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d)) return d as LancamentoRecuperado[];
  if (Array.isArray(d["lancamentos"])) return d["lancamentos"] as LancamentoRecuperado[];
  if (d["json"] && typeof d["json"] === "object") {
    const inner = d["json"] as Record<string, unknown>;
    if (Array.isArray(inner["lancamentos"])) return inner["lancamentos"] as LancamentoRecuperado[];
  }
  return [];
}

/** Converte LancamentoRecuperado[] → LancamentoItem[] (formato da tabela principal) */
function converterParaLancamentoItem(itens: LancamentoRecuperado[]): LancamentoItem[] {
  return itens.map((l, index) => ({
    id: l.id ?? Date.now() + index,
    numero: index + 1,
    descricao: l.descricao,
    dataInicial: l.dataInicial,
    dataCalculo: l.dataCalculo,
    valorPrincipal: l.valorPrincipal,
    indiceCorrecao: l.indiceCorrecao,
    valorAtualizado: l.valorAtualizado,
    dias: l.dias,
    percentualCorrecao: l.percentualCorrecao,
    indiceJuros: l.indiceJuros,
    dataInicioJuros: l.dataInicioJuros ?? "",
    dataFimJuros: l.dataFimJuros ?? "",
    juros: l.juros,
    total: l.total,
  }));
}

interface ModalRecuperarProps {
  onClose: () => void;
  onRecuperar: (itens: LancamentoItem[]) => void;
}

function ModalRecuperar({ onClose, onRecuperar }: ModalRecuperarProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sucesso" | "gerando" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");
  const [lancamentosRecuperados, setLancamentosRecuperados] = useState<LancamentoRecuperado[]>([]);
  const [metaDados, setMetaDados] = useState<DadosRecuperados | null>(null);

  const buscar = async () => {
    if (!tokenInput.trim()) return;
    setStatus("loading");
    setMensagem("");
    setLancamentosRecuperados([]);
    setMetaDados(null);
    try {
      const resultado = await buscarPorToken(tokenInput.trim());
      const recuperados = extrairLancamentos(resultado);
      setLancamentosRecuperados(recuperados);
      setMetaDados(resultado as DadosRecuperados);
      // Converte e envia para a tabela principal imediatamente
      onRecuperar(converterParaLancamentoItem(recuperados));
      setStatus("sucesso");
    } catch (e: unknown) {
      setMensagem(e instanceof Error ? e.message : "Erro desconhecido.");
      setStatus("erro");
    }
  };

  const handleGerarPDF = () => {
    if (lancamentosRecuperados.length === 0) return;
    setStatus("gerando");
    try {
      gerarPDFRecuperado(lancamentosRecuperados, tokenInput.trim());
    } finally {
      setStatus("sucesso");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-5 border border-gray-200 max-h-[90vh] overflow-hidden">

        {/* Header fixo */}
        <div className="flex justify-between items-start px-8 pt-8">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Recuperar Lançamentos por Token</h2>
            <p className="text-sm text-gray-500 mt-1">
              Insira o token gerado anteriormente para recuperar e gerar o PDF.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none ml-4 mt-1 shrink-0"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex flex-col gap-4 px-8 overflow-y-auto">

          {/* Campo + botão buscar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: 3f2a1b4c-…"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={buscar}
              disabled={status === "loading" || !tokenInput.trim()}
              className="px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {status === "loading" ? "Buscando…" : "Buscar"}
            </button>
          </div>

          {/* Erro */}
          {status === "erro" && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {mensagem}
            </div>
          )}

          {/* Dados encontrados */}
          {(status === "sucesso" || status === "gerando") && lancamentosRecuperados.length > 0 && (
            <div className="flex flex-col gap-3">

              {/* Banner + meta */}
              <div className="flex items-center bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    ✓ {lancamentosRecuperados.length} lançamento(s) encontrado(s)
                  </span>
                  {metaDados?.geradoEm && (
                    <span className="text-xs text-green-700 mt-0.5">
                      Gerado em: {new Date(metaDados.geradoEm).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabela preview */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="text-xs text-gray-700 w-full">
                  <thead>
                    <tr className="bg-gray-100 text-left text-[10px] uppercase text-gray-500 divide-x divide-gray-200">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2">Data Inicial</th>
                      <th className="px-3 py-2">Valor Principal</th>
                      <th className="px-3 py-2">Índice</th>
                      <th className="px-3 py-2">Valor Atualizado</th>
                      <th className="px-3 py-2">Juros</th>
                      <th className="px-3 py-2 text-green-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lancamentosRecuperados.map((l, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-3 py-2 font-medium text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{l.descricao}</td>
                        <td className="px-3 py-2">{formatDate(l.dataInicial)}</td>
                        <td className="px-3 py-2">{formatBRL(l.valorPrincipal)}</td>
                        <td className="px-3 py-2">{l.indiceCorrecao}</td>
                        <td className="px-3 py-2 text-blue-700 font-semibold">{formatBRL(l.valorAtualizado)}</td>
                        <td className="px-3 py-2">{formatBRL(l.juros)}</td>
                        <td className="px-3 py-2 text-green-700 font-bold">{formatBRL(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {lancamentosRecuperados.length > 1 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-bold text-gray-800 divide-x divide-gray-200 text-xs border-t-2 border-gray-300">
                        <td className="px-3 py-2" colSpan={3}>Total Geral</td>
                        <td className="px-3 py-2">{formatBRL(lancamentosRecuperados.reduce((s, l) => s + l.valorPrincipal, 0))}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-blue-700">{formatBRL(lancamentosRecuperados.reduce((s, l) => s + l.valorAtualizado, 0))}</td>
                        <td className="px-3 py-2">{formatBRL(lancamentosRecuperados.reduce((s, l) => s + l.juros, 0))}</td>
                        <td className="px-3 py-2 text-green-700">{formatBRL(lancamentosRecuperados.reduce((s, l) => s + l.total, 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Botão Gerar PDF */}
              <button
                onClick={handleGerarPDF}
                disabled={status === "gerando"}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <MdPictureAsPdf className="h-5 w-5" />
                {status === "gerando" ? "Gerando PDF…" : "Gerar PDF dos Lançamentos Recuperados"}
              </button>
            </div>
          )}

          {/* Sem lançamentos */}
          {status === "sucesso" && lancamentosRecuperados.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
              ⚠️ Token encontrado, mas nenhum lançamento foi identificado nos dados retornados.
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="px-8 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalRecuperar;

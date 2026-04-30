import React, { useState, useEffect } from 'react';
import type { LancamentoItem } from '../../App';
import { calcularDatasParcelas, formatDate } from '../../utils/dateUtils';

interface ModalDuplicarProps {
  isOpen: boolean;
  onClose: () => void;
  lancamentoBase: LancamentoItem | null;
  onConfirmar: (datas: string[]) => void;
}

export default function ModalDuplicar({ isOpen, onClose, lancamentoBase, onConfirmar }: ModalDuplicarProps) {
  const [numeroParcelas, setNumeroParcelas] = useState<string>('');
  const [parcelasPreview, setParcelasPreview] = useState<string[]>([]);

  // Limpa o estado quando o modal fecha ou muda a base
  useEffect(() => {
    if (!isOpen) {
      setNumeroParcelas('');
      setParcelasPreview([]);
    }
  }, [isOpen, lancamentoBase]);

  if (!isOpen || !lancamentoBase) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      gerarPreview();
    }
  };

  const gerarPreview = () => {
    const parcelasNum = parseInt(numeroParcelas, 10);
    // Se quiser duplicar "em 5", gera 4 novas parcelas. Então precisa ser > 1
    if (isNaN(parcelasNum) || parcelasNum <= 1) {
      setParcelasPreview([]);
      return;
    }
    // Gera N - 1 parcelas
    const datas = calcularDatasParcelas(lancamentoBase.dataInicial, parcelasNum - 1);
    setParcelasPreview(datas);
  };

  const handleOk = () => {
    if (parcelasPreview.length > 0) {
      onConfirmar(parcelasPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Duplicar Lançamento</h2>
          <p className="text-sm text-gray-500 mt-1">
            Lançamento base: <span className="font-semibold text-gray-700">{lancamentoBase.descricao}</span>
          </p>
          <p className="text-xs text-gray-400">Data Inicial original: {formatDate(lancamentoBase.dataInicial)}</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Número de parcelas a duplicar:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 5"
              min="2"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
            <button
              onClick={gerarPreview}
              className="bg-blue-50 text-blue-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors"
            >
              Gerar
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Digite o número total de parcelas (incluindo a atual) e aperte Enter ou Gerar.</p>

          {/* Tabela de Pré-visualização */}
          {parcelasPreview.length > 0 && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-200 w-24 text-center">Parcela</th>
                    <th className="px-4 py-3 border-b border-gray-200">Data Inicial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parcelasPreview.map((dataStr, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center font-medium text-gray-700">
                        {index + 2}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {formatDate(dataStr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleOk}
            disabled={parcelasPreview.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

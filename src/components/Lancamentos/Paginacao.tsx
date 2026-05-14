import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginacaoProps {
  currentPage: number;
  totalPages: number;
  pageInput: string;
  onPageInput: (v: string) => void;
  onGoToPage: (p: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function Paginacao({
  currentPage,
  totalPages,
  pageInput,
  onPageInput,
  onGoToPage,
  onPrev,
  onNext,
}: PaginacaoProps) {
  const commit = (val: string) => {
    let p = parseInt(val);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    onGoToPage(p);
  };

  // Limita a 5 páginas visíveis para evitar overflow em mobile
  const getVisiblePages = (): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2)
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* "Ir para" — oculto em telas muito pequenas */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Ir para:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => onPageInput(e.target.value)}
          onBlur={() => commit(pageInput)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
          }}
          className="w-14 h-8 text-center border border-gray-300 dark:border-[#21262d] rounded text-sm focus:outline-none focus:border-blue-500 bg-white dark:bg-[#010409] text-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Botões de navegação entre páginas */}
      <div className="flex gap-1.5">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-8 h-8 rounded border ${
            currentPage === 1
              ? "border-gray-200 dark:border-[#21262d] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-[#010409] cursor-not-allowed"
              : "border-gray-300 dark:border-[#21262d] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#1e232b]"
          } transition-colors`}
          title="Página Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onGoToPage(page)}
            className={`w-8 h-8 rounded border text-sm font-medium ${
              currentPage === page
                ? "border-blue-500 bg-blue-50 dark:bg-[#007aff]/20 text-blue-600 dark:text-[#007aff]"
                : "border-gray-300 dark:border-[#21262d] bg-white dark:bg-[#0d1117] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e232b]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center w-8 h-8 rounded border ${
            currentPage === totalPages
              ? "border-gray-200 dark:border-[#21262d] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-[#010409] cursor-not-allowed"
              : "border-gray-300 dark:border-[#21262d] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-[#1e232b]"
          } transition-colors`}
          title="Próxima Página"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default Paginacao;

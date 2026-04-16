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

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Ir para:</span>
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
          className="w-16 h-8 text-center border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-8 h-8 rounded border ${
            currentPage === 1
              ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
          } transition-colors`}
          title="Página Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onGoToPage(idx + 1)}
              className={`w-8 h-8 rounded border text-sm font-medium ${
                currentPage === idx + 1
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center w-8 h-8 rounded border ${
            currentPage === totalPages
              ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
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

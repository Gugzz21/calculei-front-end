import MdPictureAsPdf from "@mui/icons-material/PictureAsPdf";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

interface BotoesExportProps {
  temLancamentos: boolean;
  salvandoPDF: boolean;
  onGerarPDF: () => void;
  onBaixarImagem: () => void;
  onExportarExcel: () => void;
}

function BotoesExport({
  temLancamentos,
  salvandoPDF,
  onGerarPDF,
  onBaixarImagem,
  onExportarExcel,
}: BotoesExportProps) {
  const baseBtn = "h-[40px] flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all font-medium shadow-sm";
  const ativo   = "bg-white dark:bg-[#0d1117] border border-[#ADB4C2] dark:border-[#21262d] text-[#1F2022] dark:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#1e232b] cursor-pointer";
  const inativo = "bg-[#f1f3f5] dark:bg-[#010409] border border-[#d2d6dc] dark:border-[#21262d] text-[#adb5bd] dark:text-gray-500 cursor-not-allowed";

  return (
    <div className="flex items-center justify-start">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

        {/* Gerar PDF */}
        <button
          type="button"
          onClick={onGerarPDF}
          disabled={!temLancamentos || salvandoPDF}
          title="Gerar PDF e salvar token"
          className={`flex-1 sm:flex-none sm:w-[160px] ${baseBtn} ${!temLancamentos || salvandoPDF ? inativo : ativo}`}
        >
          <MdPictureAsPdf className="h-[20px] w-[20px] shrink-0" />
          <span className="text-[14px]">{salvandoPDF ? "Salvando…" : "Gerar PDF"}</span>
        </button>

        {/* Baixar imagem */}
        <button
          type="button"
          onClick={onBaixarImagem}
          disabled={!temLancamentos}
          title="Salvar tabela como imagem"
          className={`flex-1 sm:flex-none sm:w-[200px] ${baseBtn} ${!temLancamentos ? inativo : ativo}`}
        >
          <CameraAltIcon className="h-[20px] w-[20px] shrink-0" />
          <span className="text-[14px]">Printar e salvar</span>
        </button>

        {/* Exportar Excel */}
        <button
          type="button"
          onClick={onExportarExcel}
          disabled={!temLancamentos}
          title="Exportar dados para Excel (.xlsx)"
          className={`flex-1 sm:flex-none sm:w-[160px] ${baseBtn} ${!temLancamentos ? inativo : ativo}`}
        >
          <svg className="h-[20px] w-[20px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[14px]">Exportar Excel</span>
        </button>

      </div>
    </div>
  );
}

export default BotoesExport;

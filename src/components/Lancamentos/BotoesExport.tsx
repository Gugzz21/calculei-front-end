import MdPictureAsPdf from "@mui/icons-material/PictureAsPdf";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

interface BotoesExportProps {
  temLancamentos: boolean;
  salvandoPDF: boolean;
  onGerarPDF: () => void;
  onBaixarImagem: () => void;
}

function BotoesExport({
  temLancamentos,
  salvandoPDF,
  onGerarPDF,
  onBaixarImagem,
}: BotoesExportProps) {
  const baseBtn = "h-[40px] flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all font-medium shadow-sm";
  const ativo   = "bg-white border border-[#ADB4C2] text-[#1F2022] hover:bg-slate-50 cursor-pointer";
  const inativo = "bg-[#f1f3f5] border border-[#d2d6dc] text-[#adb5bd] cursor-not-allowed";

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

      </div>
    </div>
  );
}

export default BotoesExport;

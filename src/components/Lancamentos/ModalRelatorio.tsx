import { useState } from "react";
import { FileText, Camera, Table, Copy, Check, ChevronRight } from "lucide-react";

interface ModalRelatorioProps {
    type: "pdf" | "imagem" | "excel";
    token: string;
    onClose: () => void;
    onDownload: (nomeInvestigado?: string) => void;
}

export default function ModalRelatorio({ type, token, onClose, onDownload }: ModalRelatorioProps) {
    const [copiadoLink, setCopiadoLink] = useState(false);
    const [copiadoTexto, setCopiadoTexto] = useState(false);

    const linkRecuperacao = `${window.location.origin}/?token=${token}`;
    const textoMencao = "Os valores históricos foram atualizados com auxílio da ferramenta denominada \"Calculei\" (https://calculei.mprj.mp.br), desenvolvida pelos Núcleos Contábil e de Ciências de Dados do GATE.";

    const copiar = (texto: string, setStatus: (s: boolean) => void) => {
        navigator.clipboard.writeText(texto).then(() => {
            setStatus(true);
            setTimeout(() => setStatus(false), 2000);
        });
    };

    const [nomeInvestigado, setNomeInvestigado] = useState("");




    const config = {
        pdf: { titulo: "Relatório em PDF", labelBotao: "Baixar PDF", Icone: FileText },
        imagem: { titulo: "Print de Lançamentos", labelBotao: "Baixar imagem", Icone: Camera },
        excel: { titulo: "Relatório em Excel", labelBotao: "Baixar Excel", Icone: Table },
    }[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0d1117] rounded-xl shadow-2xl w-full max-w-[600px] border border-gray-200 dark:border-[#30363d] overflow-hidden transition-all duration-200">

                {/* Cabeçalho */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
                        {config.titulo}
                    </h2>
                </div>

                {/* Conteúdo */}
                <div className="px-8 pb-6 flex flex-col gap-6">

                    <div className="">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium pb-3">
                            Insira o nome do Investigado (Opcional):
                        </p>
                        <div className="flex-1 bg-gray-50 dark:bg-[#010409] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 font-mono break-all line-clamp-2">
                            <input
                                type="text"
                                placeholder="Nome do investigado"
                                className="w-full bg-transparent outline-none"
                                value={nomeInvestigado}
                                onChange={(e) => setNomeInvestigado(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Link de Recuperação */}
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                            Recupere seu cálculo futuramente, copie o link abaixo.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-50 dark:bg-[#010409] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 font-mono break-all line-clamp-2">
                                {linkRecuperacao}
                            </div>
                            <button
                                onClick={() => copiar(linkRecuperacao, setCopiadoLink)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#21262d] border border-gray-300 dark:border-[#30363d] rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors"
                            >
                                {copiadoLink ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copiadoLink ? "Copiar" : "Copiar"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Seção Menção (para todos os tipos) */}
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                            Para mencionar o Calculei, utilize o texto abaixo.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-gray-50 dark:bg-[#010409] border border-gray-200 dark:border-[#30363d] rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 italic">
                                {textoMencao}
                            </div>
                            <button
                                onClick={() => copiar(textoMencao, setCopiadoTexto)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#21262d] border border-gray-300 dark:border-[#30363d] rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#30363d] transition-colors"
                            >
                                {copiadoTexto ? <Check size={16} /> : <Copy size={16} />}
                                <span>{copiadoTexto ? "Copiado!" : "Copiar"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end items-center gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            Fechar
                        </button>

                        <button
                            onClick={() => onDownload(nomeInvestigado)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#073365] dark:bg-[#1a4b8c] text-white rounded-lg text-sm font-bold hover:bg-[#0a4282] dark:hover:bg-[#2563eb] transition-all shadow-lg active:scale-95"
                        >
                            {type === "imagem" ? <ChevronRight size={18} /> : <config.Icone className="w-[18px] h-[18px]" />}
                            <span>{config.labelBotao}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

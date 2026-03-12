function Lancamentos() {
    return (
        <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full max-w-[1200px] h-auto ml-95 p-6 mt-6 gap-5 shadow-sm border border-slate-200">
            <h1 className="text-[18px] text-gray-700 font-semibold">Lançamentos</h1>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700">
                    <thead>
                        <tr className="border-b-2 border-gray-300 text-left text-[12px] text-gray-500 uppercase">
                            <th className="pb-2 pr-12 ">Descrição</th>
                            <th className="pb-2 pr-12">Data Inicial</th>
                            <th className="pb-2 pr-12">Valor Principal</th>
                            <th className="pb-2 pr-12">Data do Cálculo</th>
                            <th className="pb-2 pr-12">Índice de Correção</th>
                            <th className="pb-2 pr-12">Valor Atualizado</th>
                            <th className="pb-2 pr-12">Dias</th>
                            <th className="pb-2 pr-12">Juros</th>
                            <th className="pb-2 pr-12">Total</th>
                            <th className="pb-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3 pr-4"></td>
                            <td className="py-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Lancamentos;
interface DescricaoProps {
  value: string;
  onChange: (value: string) => void;
}

function Descricao({ value, onChange }: DescricaoProps) {
  return (
    <div className="flex flex-col gap-1 w-full md:w-[320px]">
      <strong className="text-[13px] text-gray-700 font-semibold">Descrição</strong>
      <select
        className="bg-white border border-blue-400 h-[45px] w-full px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="ressarci">Ressarcimento</option>
        <option value="ressarcimentoaoetario">Ressarcimento ao etário</option>
        <option value="debitosdfp">Débitos da Fazenda Pública</option>
        <option value="multacivil">Multa Civil</option>
        <option value="honorariosadvocaticios">Honorários Advocatícios</option>
        <option value="outros">Outros</option>
      </select>
    </div>
  );
}

export default Descricao;
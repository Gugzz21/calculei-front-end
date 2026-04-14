interface TipoCalculoProps {
  value: string;
  onChange: (value: string) => void;
}

function TipoCalculo({ value, onChange }: TipoCalculoProps) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">
        Tipo de Cálculo
      </strong>
      <select
        className="bg-white border border-gray-300 h-[45px] w-[570px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="cdparticular">
          Créditos / Débitos Entre Particulares
        </option>
        <option value="cfazenda">Créditos da Fazenda Pública</option>
        <option value="dfazendatributario">
          Débitos da Fazenda Pública - Tributários
        </option>
        <option value="dfazendanaotributario">
          Débitos da Fazenda Pública - Não Tributários
        </option>
        <option value="previdenciario">Débitos Previdenciários</option>
        <option value="precatoriostributario">Precatórios - Tributários</option>
        <option value="precatoriosnaotributario">
          Precatórios - Não Tributários
        </option>
        <option value="multadiaria">Multa diária</option>
      </select>
    </div>
  );
}

export default TipoCalculo;

interface IndiceCorrecaoProps {
  value: string;
  onChange: (value: string) => void;
}

function IndiceCorrecao({ value, onChange }: IndiceCorrecaoProps) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">Índice de correção monetária</strong>
      <select
        className="bg-white border border-gray-300 h-[45px] w-full md:w-[330px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="ipcae">IPCA-E</option>
        <option value="igpm">IGP-M</option>
        <option value="tr">TR</option>
        <option value="inpc">INPC</option>
        <option value="igpdi">IGP-DI</option>
        <option value="ipca">IPCA</option>
        <option value="ipcbr">IPC-BR</option>
        <option value="cdi">CDI</option>
        <option value="selic">SELIC</option>
        <option value="semcorrecaomonetaria">SEM CORREÇÃO MONETÁRIA</option>
        <option value="tjrj119602009ortnotnbnttrufiripcae">TJRJ 11.960/2009 (ORTN-OTN-BNT TR-UFIR-IPCA-E)</option>
        <option value="tjrj119602009ipcaeselic">TJRJ 11.960/2009 IPCA/SELIC</option>
      </select>
    </div>
  );
}

export default IndiceCorrecao;
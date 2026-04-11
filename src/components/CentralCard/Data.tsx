interface DataProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
}

function Data({ title, value, onChange, max, min }: DataProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <strong className="text-[14px] text-gray-700 font-semibold">
        {title}
      </strong>
      <div className="bg-white border border-gray-300 w-full md:w-[180px] h-[45px] flex items-center px-3 rounded-md">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max}
          min={min}
          className="outline-none text-sm text-gray-700 bg-transparent w-full"
        />
      </div>
    </div>
  );
}

export default Data;

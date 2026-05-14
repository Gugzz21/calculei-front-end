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
      <strong className="text-[14px] text-gray-700 dark:text-gray-300 font-semibold">
        {title}
      </strong>
      <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 w-full md:w-[180px] h-[45px] flex items-center px-3 rounded-lg transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400 dark:hover:border-slate-500">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max}
          min={min}
          className="outline-none text-sm text-gray-700 dark:text-gray-200 bg-transparent w-full"
        />
      </div>
    </div>
  );
}

export default Data;

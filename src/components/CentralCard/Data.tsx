interface DataProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
}

function Data({ title, value, onChange, max, min }: DataProps) {
  return (
<<<<<<< HEAD
    <div className="flex flex-col gap-1">
      <strong className="text-[13px] text-gray-700 font-semibold">
        {props.title}
      </strong>
      <div className="bg-white border border-blue-400 w-[180px] h-[45px] flex items-center px-3 rounded-md">
=======
    <div className="flex flex-col gap-1 w-full">
      <strong className="text-[14px] text-gray-700 font-semibold">{title}</strong>
      <div className="bg-white border border-blue-400 w-full md:w-[180px] h-[45px] flex items-center px-3 rounded-md">
>>>>>>> testeEndpoint1
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

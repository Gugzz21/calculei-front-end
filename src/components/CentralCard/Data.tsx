function Data(props: any) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[13px] text-gray-700 font-semibold">{props.title}</strong>
      <div className="bg-white border border-blue-400 w-[180px] h-[45px] flex items-center px-3 rounded-md">
        <input
          type="date"
          className="outline-none text-sm text-gray-700 bg-transparent w-full"
        />
      </div>
    </div>
  );
}

export default Data;

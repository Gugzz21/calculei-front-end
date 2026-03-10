function Data(props: any) {
    return (

        <div className="flex flex-col">
            <strong className="text-[14px]">{props.title}</strong>
            <form className="bg-white border-black border-[1px] w-[180px] h-[60px] flex justify-center items-center rounded-[5  px]">
                <label htmlFor=""></label>
                <input type="date" />
            </form>
        </div>
    )
}

export default Data;
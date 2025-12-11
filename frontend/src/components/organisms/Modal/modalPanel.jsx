export default function ModalPanel({
  title,
  children,
  onSubmit,
  handleClose,
  btnLabel,
  isSuccess,
  mode,
}) {
  return (
    // <div className="relative w-full md:w-full md:h-full lg:h-auto lg:w-auto lg:max-w-2xl md:justify-center md:items-center md:flex m-auto border border-slate-200 rounded-xl p-3 lg:p-5 shadow-lg bg-slate-100">
    <div
      className={`flex justify-center items-center m-auto lg:max-w-2xl h-fit w-full lg:w-auto`}
    >
      <div
        className={`relative bg-slate-100 p-5 rounded-xl shadow-lg max-w-2xl w-full`}
      >
        {handleClose && (
          <span
            className={`material-symbols-outlined absolute right-2 top-2 p-0.5 hover:bg-slate-300 hover:text-red-700 cursor-pointer rounded-full select-none`}
            onClick={handleClose}
          >
            close
          </span>
        )}

        <h2 className="font-semibold text-xl text-center pt-5 lg:pt-5 pb-7 lg:pb-10 md:text-2xl lg:text-2xl xl:text-2xl transition-all duration-300">
          {title}
        </h2>

        <div
          className={`
            transition-all duration-300 ease-in-out flex flex-col items-center
          `}
        >
          {(mode === "form" || mode === "edit") && (
            <form
              className="mb-8 flex flex-col justify-center items-center my-auto w-full transition-all duration-300"
              onSubmit={onSubmit}
            >
              {children}
              <div className="flex justify-center mt-3 md:mt-6 lg:mt-7 mx-auto sm:w-1/3 md:w-full">
                <button className="sm:w-40 lg:w-80 mx-auto font-sans font-semibold text-lg xl:text-medium bg-red-400 shadow-sm rounded-xl px-6 py-0.5 lg:py-1.5 hover:bg-linear-to-br transition-all hover:text-slate-100 hover:shadow-lg cursor-pointer">
                  {btnLabel}
                </button>
              </div>
            </form>
          )}
          {mode === "success" && (
            <div className="z-10 flex flex-col justify-center items-center my-auto w-full max-h-full overflow-hidden transition-all duration-300">
              {children}
              <button
                onClick={onSubmit}
                className="z-50 mt-6 sm:w-40 text-lg bg-red-400 shadow-sm rounded-xl px-6 py-1.5 hover:shadow-lg hover:text-white transition cursor-pointer"
              >
                {btnLabel}
              </button>
            </div>
          )}
          {mode === "confirm" && (
            <div className="z-10 flex gap-6 justify-center items-center my-auto w-full max-h-full overflow-hidden transition-all duration-300">
              <button
                onClick={onSubmit}
                className="z-50 mt-6 sm:w-40 text-lg bg-red-400 shadow-sm rounded-xl px-6 py-1.5 hover:shadow-lg hover:bg-red-700 hover:text-white transition cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={handleClose}
                className="z-50 mt-6 sm:w-40 text-lg bg-slate-400 shadow-sm rounded-xl px-6 py-1.5 hover:shadow-lg hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { X } from "lucide-react";

export default function ModalPanel({
  title,
  subtitle,
  children,
  handleClose,
  titlePosition = "text-center",
  badgeColor,
  badgeLabel,
  loading = false,
}) {
  return (
    // <div className="relative w-full md:w-full md:h-full lg:h-auto lg:w-auto lg:max-w-2xl md:justify-center md:items-center md:flex m-auto border border-slate-200 rounded-xl p-3 lg:p-5 shadow-lg bg-slate-100">
    <div className={`flex justify-center items-center m-auto h-fit w-full`}>
      <div
        className={`relative bg-slate-100 p-5 rounded-xl shadow-lg w-full h-full`}
      >
        {handleClose && (
          <span
            className={`absolute right-2 top-2 p-0.5 hover:bg-slate-300 hover:text-red-700 cursor-pointer rounded-full select-none`}
            onClick={handleClose}
          >
            <X />
          </span>
        )}
        <div className="flex gap-2 items-center my-5">
          {loading ? (
            <>
              <div className="flex flex-col flex-1 gap-0.5 text-transparent">
                <h2
                  className={`skeleton rounded-xl bg-slate-200 w-fit font-semibold text-xl ${titlePosition} mt-5 md:text-2xl`}
                >
                  Loading...
                </h2>
                <h5
                  className={`skeleton rounded-xl bg-slate-200 w-fit font-medium text-base ${titlePosition} mb-5 md:text-base`}
                >
                  Loading
                </h5>
              </div>
              <div
                className={`skeleton bg-slate-200 text-transparent px-2 py-0.5 mr-2 rounded-full text-sm h-fit flex`}
              >
                Loading
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col flex-1 justify-center">
                <h2
                  className={`font-semibold text-xl ${titlePosition} transition-all duration-300 md:text-2xl 
                  `}
                >
                  {title}
                </h2>
                {subtitle && (
                  <h5
                    className={`font-medium text-base ${titlePosition} transition-all duration-300 text-slate-400 md:text-base`}
                  >
                    {subtitle}
                  </h5>
                )}
              </div>
              {badgeColor && (
                <div
                  className={`px-2 py-0.5 mr-2 rounded-full outline-1 text-sm h-fit flex ${badgeColor}`}
                >
                  {badgeLabel}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className={`
            transition-all duration-300 ease-in-out flex flex-col items-center
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

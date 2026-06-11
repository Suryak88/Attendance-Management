export default function FormDelete({ onSubmit, onClose }) {
  return (
    <div className="z-10 flex gap-6 p-1 justify-center items-center my-auto w-full max-h-full overflow-hidden transition-all duration-300">
      <button
        onClick={onSubmit}
        className="z-50 mt-6 sm:w-40 text-base bg-red-400 shadow-sm rounded-xl px-6 py-1.5 hover:shadow-lg hover:bg-red-500 hover:text-white transition cursor-pointer"
      >
        Yes
      </button>
      <button
        onClick={onClose}
        className="z-50 mt-6 sm:w-40 text-base bg-slate-200 shadow-sm rounded-xl px-6 py-1.5 hover:shadow-lg outline outline-slate-300  hover:outline-slate-500 hover:text-black/60 transition cursor-pointer"
      >
        No
      </button>
    </div>
  );
}

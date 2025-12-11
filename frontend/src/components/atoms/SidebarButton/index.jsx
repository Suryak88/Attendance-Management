export default function SidebarButton({
  id,
  name,
  icon,
  active,
  handleClick,
  type = "single",
  arrowOpen = false,
}) {
  return (
    <button
      className={`w-full py-2 rounded-xl text-slate-800 font-sans font-medium text-lg text-left hover:bg-[oklch(90.8%_0.01615_254.593)] 
      transition-all duration-300 ease-in-out
      focus:outline-none focus:ring-1 focus:ring-slate-400 focus:text-red-900 flex cursor-pointer overflow-hidden
      ${active ? "bg-slate-200 text-black" : ""} 
      ${["child", "parent"].includes(type) ? "mt-1" : "my-1"} 
      px-2
      lg:px-1
      xl:px-3`}
      key={id}
      onClick={handleClick}
    >
      <span
        className="material-symbols-outlined align-middle leading-none 
      pr-2
      lg:px-1.5 lg:text-xl! 
      xl:pr-3 xl:text-[24px]!"
      >
        {icon}
      </span>
      <div className="text-base lg:text-sm xl:text-base grow">{name}</div>
      {type === "parent" && (
        <span
          className={`material-symbols-outlined leading-none transition-transform ease-in-out duration-500
           lg:text-xl! xl:text-[24px]! ${
             arrowOpen ? "rotate-180 " : "rotate-0"
           }`}
        >
          keyboard_arrow_down
        </span>
      )}
    </button>
  );
}

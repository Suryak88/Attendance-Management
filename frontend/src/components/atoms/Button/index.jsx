export default function Button({
  btnLabel,
  handleClick,
  btnTitle = "",
  btnColor = "bg-red-400",
  withIcon = "",
  btnWidth = "sm:w-40 lg:w-80",
  textSize = "text-lg",
  btndisable = false,
}) {
  return (
    <button
      title={btnTitle}
      disabled={btndisable}
      className={`z-20 mx-auto font-sans font-semibold ${textSize} ${btnColor} shadow-md rounded-full px-6 py-0.5 hover:bg-linear-to-br transition-all text-center hover:text-slate-100 hover:shadow-lg cursor-pointer ${withIcon} 
      ${btnWidth} lg:py-1.5
      xl:text-medium`}
      onClick={handleClick}
    >
      {btnLabel}
    </button>
  );
}

export default function TableChild({
  children,
  red,
  narrow,
  flexSize = "flex-1",
  textSize = "text-[13px]",
}) {
  return (
    <div
      className={`text-center justify-center flex ${textSize} md:text-sm xl:text-base ${flexSize} ${red ? "text-red-600 font-semibold" : ""}`}
    >
      {children}
    </div>
  );
}

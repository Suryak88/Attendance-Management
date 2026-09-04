import FloatingSelect from "../../../atoms/FloatingSelect";

export default function FilterSelect({
  label,
  id,
  options,
  value,
  handleValueChange,
  withHr = true,
}) {
  return (
    <>
      {withHr ? <hr className="text-slate-500 shadow-md" /> : ""}
      <div className="">
        <h3 className="text-sm font-medium text-slate-700 -mb-1">{label}</h3>
        <FloatingSelect
          id={id}
          options={options}
          value={value}
          onValueChange={handleValueChange}
          border="border"
          fontThickness="font-normal"
          inputFontSize="text-sm"
        />
      </div>
    </>
  );
}

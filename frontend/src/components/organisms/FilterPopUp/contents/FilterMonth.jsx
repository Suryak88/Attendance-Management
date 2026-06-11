import FloatingMonth from "../../../atoms/FloatingMonth";

export default function FilterMonth({
  selectedMonth,
  setSelectedMonth,
  displayMonth,
}) {
  return (
    <div className="">
      <h3 className="text-sm font-medium text-slate-700 -mb-1">Month</h3>
      <div>
        <FloatingMonth
          id={"month"}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          displayMonth={displayMonth}
          fontThickness="font-normal"
          border="border"
          inputFontSize="text-sm"
        />
      </div>
    </div>
  );
}

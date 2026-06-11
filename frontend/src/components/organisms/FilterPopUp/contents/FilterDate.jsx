import FloatingDate from "../../../atoms/FloatingDate";

export default function FilterDate({
  selectedStartDate,
  setSelectedStartDate,
  displayStartDate,
  setDisplayStartDate,
  selectedEndDate,
  setSelectedEndDate,
  displayEndDate,
  setDisplayEndDate,
}) {
  return (
    <div className="lg:flex gap-2">
      <div>
        <h3 className="text-sm font-medium text-slate-700 -mb-1">From</h3>
        <div>
          <FloatingDate
            id={"startDate"}
            selectedDate={selectedStartDate}
            setSelectedDate={setSelectedStartDate}
            displayValue={displayStartDate}
            setDisplayValue={setDisplayStartDate}
            fontThickness="font-normal"
            border="border"
            inputFontSize="text-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-700 -mb-1">To</h3>
        <div>
          <FloatingDate
            id={"endDate"}
            selectedDate={selectedEndDate}
            setSelectedDate={setSelectedEndDate}
            displayValue={displayEndDate}
            setDisplayValue={setDisplayEndDate}
            fontThickness="font-normal"
            border="border"
            inputFontSize="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

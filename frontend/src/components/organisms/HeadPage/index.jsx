import FilterBar from "../FilterBar";

export default function HeadPage({ label, employeeName, handleClick }) {
  return (
    <div className="p-3 font-normal flex w-full justify-between">
      <h3 className="text-xl md:text-2xl font-semibold">{label}</h3>
      <div className="flex">
        <FilterBar
          employeeName={employeeName ?? ""}
          handleClick={handleClick}
        />
      </div>
    </div>
  );
}

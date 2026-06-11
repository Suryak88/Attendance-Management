import { UserRound } from "lucide-react";
import { truncateText } from "../../../utils/truncateText";
import SidebarButton from "../../atoms/SidebarButton";

export default function FilterBar({ employeeName, handleClick }) {
  return (
    <div className="text-base flex justify-end items-center w-43 md:w-fit">
      <div className="flex items-center h-fit py-1 mx-2 md:mx-4 justify-end">
        {/* <span
          className="material-symbols-outlined align-middle leading-none select-none
                                pr-2 text-[19px]!
                                lg:px-1.5 lg:text-xl!
                                xl:pr-3 xl:text-[24px]!"
          style={{
            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
          }}
        >
          person
        </span> */}
        <span
          className="align-middle leading-none select-none
                                pr-2 text-[19px]!
                                lg:px-1.5 lg:text-xl!
                                xl:pr-3 xl:text-[24px]!"
          style={{
            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
          }}
        >
          <UserRound
            strokeWidth={"1.5px"}
            className="size-4.5 lg:size-5 xl:size-6"
          />
        </span>
        <p className="text-sm md:hidden">{truncateText(employeeName, 6)}</p>
        <p className="hidden md:flex lg:text-base">{employeeName}</p>
      </div>
      <div className="ignore-popup-close flex w-fit">
        <SidebarButton
          id="Filter"
          name={"Filter"}
          icon={"filter_list"}
          handleClick={handleClick}
          outlineDefault="outline-1 outline-slate-400"
        />
      </div>
    </div>
  );
}

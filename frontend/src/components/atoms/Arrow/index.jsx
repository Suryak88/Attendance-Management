import { useState } from "react";

export default function Arrow({ arrowOpen, handleClick }) {
  //   const [arrowOpen, setArrowOpen] = useState(true);
  return (
    <span
      className={`material-symbols-outlined leading-none transition-transform ease-in-out duration-500 cursor-pointer
           lg:text-xl! xl:text-[24px]! select-none ${
             arrowOpen ? "rotate-180 " : "rotate-0"
           }`}
      onClick={handleClick}
    >
      keyboard_arrow_down
    </span>
  );
}

import { useEffect, useRef, useState } from "react";

export default function FloatingCreatableSelect({
  id,
  options = [],
  value,
  onValueChange,
  border = "border md:border-2",
  fontThickness = "font-semibold",
  inputFontSize = "text-base py-2",
  labelFontSize = "text-sm",
}) {
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef(null);
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 220;

    setOpenUpward(spaceBelow < dropdownHeight);
  }, [open]);

  useEffect(() => {
    if (value) setFilter(value);
  }, [value]);

  const isError = touched && value.trim() === "";

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(filter.toLowerCase()),
  );

  const selectValue = (val) => {
    onValueChange(val);
    setFilter(val);
    setOpen(false);
  };

  function handleBlur() {
    if (filter === "") {
      setTouched(true);
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="ignore-popup-close relative mb-2 lg:mb-3 w-full"
    >
      <input
        id={id}
        name={id}
        placeholder={id}
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          onValueChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        className={`peer w-full mx-auto ${inputFontSize} ${border} mt-2 rounded-lg bg-transparent p-2 text-gray-900 placeholder-transparent focus:outline-none  ${
          isError
            ? "border-red-500 focus:border-red-500"
            : "border-gray-800 focus:border-blue-600"
        }`}
        required
        autoComplete="off"
      />
      <label
        htmlFor={id}
        className={`absolute left-3 bg-slate-100 px-1 text-md transition-all duration-200 first-letter:uppercase select-none
                             ${
                               value
                                 ? `top-2 -translate-y-1/2 text-gray-800 ${labelFontSize} ${fontThickness} peer-focus:text-blue-600`
                                 : `top-7.5 lg:top-7 -translate-y-1/2 text-gray-400 ${fontThickness} text-base peer-focus:top-2 peer-focus:-translate-y-1/2 ${
                                     isError
                                       ? "peer-focus:text-red-500"
                                       : "peer-focus:text-blue-600"
                                   }  peer-focus:${labelFontSize}`
                             }`}
      >
        {id}
      </label>
      {/* <p
        className={`${
          isError ? "visible" : "invisible"
        } text-sm font-normal first-letter:uppercase text-red-500 `}
      >
        Please enter/select {id}
      </p> */}

      {open && (
        <ul
          className={`absolute z-50 bg-slate-100 border border-gray-200 rounded-md mt-1 w-full max-h-40 overflow-auto shadow transition-all duration-200 ease-in-out
        ${openUpward ? "bottom-full" : "top-full"}
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <li
                key={i}
                onMouseDown={() => selectValue(opt)}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">
              Click enter to add "<b>{filter}</b>" as a new category
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

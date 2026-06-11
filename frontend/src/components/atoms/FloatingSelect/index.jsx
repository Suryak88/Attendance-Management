import { useRef } from "react";
import { useEffect, useState } from "react";

export default function FloatingSelect({
  id,
  label,
  options = [],
  value,
  onValueChange,
  message,
  border = "border md:border-2",
  fontThickness = "font-semibold",
  inputFontSize = "text-base py-2",
  labelFontSize = "text-sm",
}) {
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const [openUpward, setOpenUpward] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 220;

    setOpenUpward(spaceBelow < dropdownHeight);
  }, [open]);

  // useEffect(() => {
  //   if (value) setFilter(value);
  //   console.log(options);
  // }, [value]);

  // useEffect(() => {
  //   const selected = options.find((opt) => opt.value === value);
  //   // setFilter(selected ? selected.label : "");
  // }, [value, options]);

  const isError = touched && !value && !options.includes(value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(opt) {
    onValueChange(opt.value);
    // setFilter(opt.label);
    setSearch("");
    setOpen(false);
  }

  function handleBlur() {
    setTouched(true);
    setOpen(false);
    setSearch("");
    // filter tidak tersedia
    // kembali ke pilihan valid terakhir (jika sudah pilih)
    // const exists = options.some((opt) => opt.label === filter);
    // if (!exists) {
    //   const selected = options.find((opt) => opt.value === value);
    //   setFilter(selected ? selected.label : "");
    // }

    // dikosongkan langsung jika tidak ada
    // if (!exists) {
    //   onValueChange("");
    //   setFilter("");
    // }
  }

  return (
    <div
      ref={containerRef}
      className="ignore-popup-close relative mb-2 lg:mb-3 w-full"
    >
      <input
        id={id}
        name={`no-autofill-${id}`}
        // value={filter}
        value={open ? search : selectedOption?.label || ""}
        placeholder={id}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          // setFilter("");
          setOpen(true);
        }}
        onBlur={handleBlur}
        className={`peer w-full mx-auto ${inputFontSize} font-semibold ${border} mt-2 rounded-lg bg-transparent p-2 text-gray-900 placeholder-transparent focus:outline-none  ${
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
        {label}
      </label>

      <p
        className={`${
          isError ? "opacity-100" : "opacity-0"
        } absolute text-sm font-normal first-letter:uppercase text-red-500 transition-all duration-300 ease-in-out`}
      >
        {message}
      </p>

      <ul
        className={`absolute z-50 bg-slate-100 rounded-md mt-1 ${inputFontSize} w-full max-h-45 overflow-auto shadow transition-all duration-200 ease-in-out 
        ${openUpward ? "bottom-full" : "top-full"}
        ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {open &&
          search.length === 0 &&
          options.map((opt, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(opt)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt.label}
            </li>
          ))}

        {open &&
          search.length > 0 &&
          filteredOptions.length > 0 &&
          filteredOptions.map((opt, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(opt)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt.label}
            </li>
          ))}

        {open && search.length > 0 && filteredOptions.length === 0 && (
          <li className="px-3 py-2 text-red-500 font-semibold">
            Options not available!
          </li>
        )}
      </ul>

      {/* {open && filteredOptions.length > 0 && (
        <ul className="absolute z-50 bg-slate-100 border rounded-md mt-1 w-full max-h-40 overflow-auto shadow">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => handleSelect(opt)}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
            >
              {opt}
            </li>
          ))}
        </ul>   
      )} */}
    </div>
  );
}

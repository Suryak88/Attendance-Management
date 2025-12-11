import { useEffect, useState } from "react";

export default function FloatingSelect({
  id,
  options = [],
  value,
  onValueChange,
}) {
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (value) setFilter(value);
  }, [value]);

  const isError = touched && value.trim() === "";

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(filter.toLowerCase())
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
    <div className="relative mb-4 lg:mb-6 mx-auto">
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
        className={`peer w-full lg:w-80 mx-auto text-base font-semibold border-2 mt-2 rounded-lg bg-transparent py-1.5 lg:py-2 px-2 text-gray-900 placeholder-transparent focus:outline-none  ${
          isError
            ? "border-red-500 focus:border-red-500"
            : "border-gray-800 focus:border-blue-600"
        }`}
        required
      />
      <label
        htmlFor={id}
        className={`absolute left-3 bg-slate-100 px-1 text-md transition-all duration-200 first-letter:uppercase select-none
                             ${
                               value
                                 ? "top-2 -translate-y-1/2 text-gray-800 text-sm font-semibold peer-focus:text-blue-600"
                                 : `top-7 lg:top-7 -translate-y-1/2 text-gray-400 font-semibold text-base peer-focus:top-2 peer-focus:-translate-y-1/2 ${
                                     isError
                                       ? "peer-focus:text-red-500"
                                       : "peer-focus:text-blue-600"
                                   }  peer-focus:text-sm`
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
        <ul className="absolute z-50 bg-slate-100 border border-gray-200 rounded-md mt-1 w-full max-h-40 overflow-auto shadow">
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

import { useState } from "react";

export default function FloatingTextArea({
  id,
  value,
  onValueChange,
  message,
  border = "border md:border-2",
  borderColorDefault = "border-gray-800",
  labelFontThickness = "font-semibold",
  inputFontThickness = "font-semibold",
  isDisable,
}) {
  const [touched, setTouched] = useState(false);

  const isError = touched && value.trim() === "";

  return (
    <div className="relative w-full">
      <textarea
        id={id}
        name={id}
        placeholder={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={isDisable}
        className={`min-h-11 max-h-30 peer w-full mx-auto text-base ${inputFontThickness} ${border} mt-2 rounded-lg bg-transparent py-2 px-2 text-gray-900 placeholder-transparent focus:outline-none  ${
          isError
            ? "border-red-500 focus:border-red-500"
            : `${borderColorDefault} focus:border-blue-600`
        }`}
        required
        autoComplete="off"
      />
      <label
        htmlFor={id}
        className={`absolute left-3 bg-slate-100 px-1 text-md transition-all duration-200 first-letter:uppercase select-none
                             ${
                               value
                                 ? `top-2 -translate-y-1/2 text-gray-800 text-sm ${labelFontThickness} peer-focus:text-blue-600`
                                 : `top-7.5 lg:top-7 -translate-y-1/2 text-gray-400 ${labelFontThickness} text-base peer-focus:top-2 peer-focus:-translate-y-1/2 ${
                                     isError
                                       ? "peer-focus:text-red-500"
                                       : "peer-focus:text-blue-600"
                                   }  peer-focus:text-sm`
                             }`}
      >
        {id}
      </label>
      <p
        className={`${
          isError ? "opacity-100" : "opacity-0"
        } text-sm font-normal first-letter:uppercase text-red-500 transition-all duration-300 ease-in-out`}
      >
        {message}
      </p>
    </div>
  );
}

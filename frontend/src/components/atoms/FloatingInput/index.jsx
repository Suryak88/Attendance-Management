import { useState } from "react";

export default function FloatingInput({
  id,
  type = "text",
  value,
  onValueChange,
  message,
  autoComplete = "off",
  border = "border",
  fontThickness = "font-normal",
  inputFontSize = "text-base py-2",
  labelFontSize = "text-sm",
  isExternalError = false,
}) {
  // const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  // const isError = touched && value.trim() === "";

  const isError = isExternalError || (touched && value.trim() === "");

  return (
    <div className="relative w-full">
      <input
        type={type}
        id={id}
        name={id}
        placeholder={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => setTouched(true)}
        autoComplete={autoComplete}
        className={`peer w-full mx-auto ${inputFontSize} font-semibold ${border} mt-2 rounded-lg bg-transparent py-2 px-2 text-gray-900 placeholder-transparent focus:outline-none  ${
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
            ? `top-2 -translate-y-1/2 ${labelFontSize} ${fontThickness} ${isError ? "text-red-500" : "peer-focus:text-blue-600 text-gray-800"}`
            : `top-7.5 lg:top-7 -translate-y-1/2 text-gray-400 ${fontThickness} text-base peer-focus:top-2 peer-focus:-translate-y-1/2 ${
                isError ? "peer-focus:text-red-500" : "peer-focus:text-blue-600"
              }  peer-focus:${labelFontSize}`
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

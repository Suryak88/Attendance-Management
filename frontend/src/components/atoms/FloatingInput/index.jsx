import { useState } from "react";

export default function FloatingInput({
  id,
  type = "text",
  value,
  onValueChange,
  message,
}) {
  // const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const isError = touched && value.trim() === "";

  return (
    <div className="relative mb-4 lg:mb-6 mx-auto">
      <input
        type={type}
        id={id}
        name={id}
        placeholder={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={() => setTouched(true)}
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
      <p
        className={`${
          isError ? "visible" : "invisible"
        } text-sm font-normal first-letter:uppercase text-red-500 `}
      >
        {message}
      </p>
    </div>
  );
}

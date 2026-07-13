import { File, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Modal from "../../organisms/Modal";

export default function FloatingUpload({
  id,
  label,
  accept,
  value,
  onValueChange,
  message,
  autoComplete = "off",
  border = "border",
  fontThickness = "font-normal",
  inputFontSize = "text-base py-2",
  labelFontSize = "text-sm",
  isExternalError = false,
  onPreview,
  openWithMode,
}) {
  //   const [touched, setTouched] = useState(false);
  //   const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const isError = isExternalError;
  //   || (touched && !value);
  const MAX_SIZE = 5 * 1024 * 1024;
  //   const [onPreview, setOnPreview] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleChange(e) {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    const file = e.target.files[0];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PNG, JPG, and PDF are allowed.");
      inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Maximum file size is 5 MB.");
      inputRef.current.value = "";
      return;
    }

    if (!file) return;

    // setTouched(true);
    onValueChange(file);

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  function handleClick() {
    inputRef.current.value = "";
    inputRef.current.click();
  }

  return (
    <div className="relative w-full">
      <input
        hidden
        ref={inputRef}
        type="file"
        id={id}
        accept={accept}
        onChange={handleChange}
        required
      />
      <div
        onClick={value ? undefined : handleClick}
        className={`mt-2 rounded-lg outline-2 outline-dashed outline-slate-600
                   h-26 flex flex-col items-center justify-center ${!value ? "cursor-pointer" : ""}`}
      >
        {!value ? (
          <>
            <p className="flex items-center gap-2">
              <Upload className="size-4.5" />
              Upload File Here
            </p>
            <p className="text-sm">PNG, JPG, or PDF (Max. 5 MB)</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              {value?.type.startsWith("image/") ? (
                <img
                  src={preview}
                  onClick={() => {
                    onPreview({ file: value, preview });
                    openWithMode("preview");
                  }}
                  className="h-12 rounded object-cover cursor-zoom-in select-none hover:opacity-80 transition"
                />
              ) : (
                <File />
              )}
              <div>
                <p className="font-semibold text-slate-700">{value?.name}</p>

                <p className="text-sm text-slate-500">
                  {(value?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <p
              className="text-xs font-medium cursor-pointer text-blue-600"
              onClick={handleClick}
            >
              Click to change file
            </p>
          </>
        )}
      </div>
      <label
        htmlFor={id}
        className={`left-3 top-2 -translate-y-1/2 absolute bg-slate-100 px-1 ${labelFontSize} ${fontThickness} transition-all duration-400 first-letter:uppercase select-none text-gray-800
        ${
          value
            ? `${isError ? "text-red-500" : "peer-focus:text-blue-600 "}`
            : `text-base peer-focus:top-2 peer-focus:-translate-y-1/2 ${
                isError ? "peer-focus:text-red-500" : "peer-focus:text-blue-600"
              }  peer-focus:${labelFontSize}`
        }`}
      >
        {label}
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

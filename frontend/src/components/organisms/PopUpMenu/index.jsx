import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function PopUpMenu({
  position,
  open,
  onClose,
  children,
  popupWidth = "w-40",
  zIndex = "z-40",
}) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    if (!ref.current || !position || !open) return;

    const menuRect = ref.current.getBoundingClientRect();
    const gap = 6;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // ---- Vertical ----
    const spaceBelow = viewportHeight - position.bottom;
    const spaceAbove = position.top;

    let top;
    let originY;

    if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
      // tampil ke atas
      top = position.top - menuRect.height - gap;
      originY = "bottom";
    } else {
      // tampil ke bawah (default)
      top = position.bottom + gap;
      originY = "top";
    }

    // ---- Horizontal ----
    let left = position.right - menuRect.width - 8;
    if (left < 8) left = 8;
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 8;
    }

    setStyle({
      top,
      left,
      transformOrigin: `${originY} right`,
    });
  }, [position, open]);

  // useEffect(() => {
  //   const close = () => onClose();
  //   window.addEventListener("click", close);
  //   return () => window.removeEventListener("click", close);
  // }, []);

  useEffect(() => {
    if (!open) return;

    const close = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;

      if (e.target.closest(".ignore-popup-close")) return;

      onClose();
    };

    document.addEventListener("mousedown", close, true);

    return () => {
      document.removeEventListener("mousedown", close, true);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={`fixed ${zIndex} p-1 bg-slate-100 rounded-xl shadow-lg ${popupWidth} outline-1 outline-slate-400 transition-all duration-200 ease-in-out origin-top-right ${
        open
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={style}
    >
      {children}
    </div>
  );
}

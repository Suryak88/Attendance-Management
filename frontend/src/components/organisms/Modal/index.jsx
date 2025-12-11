import { useEffect, useState } from "react";

export default function Modal({ openModal, onClose, children }) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (openModal) {
      setShow(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300);
    }
  }, [openModal]);

  if (!show) return null;

  return (
    <div
      className={`fixed z-50 inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
        animate ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto w-3/4 md:w-1/2 lg:w-1/2 h-fit flex rounded-xl transition-all duration-300 ease-in-out ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

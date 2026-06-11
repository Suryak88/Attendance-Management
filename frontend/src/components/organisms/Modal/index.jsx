import { useEffect, useState } from "react";

export default function Modal({
  openModal,
  onClose,
  children,
  contentWidth = "w-3/4 lg:w-fit ",
}) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  // useEffect(() => {
  //   if (openModal) {
  //     setShow(true);

  //     requestAnimationFrame(() => {
  //       requestAnimationFrame(() => {
  //         setAnimate(true);
  //       });
  //     });
  //   } else {
  //     setAnimate(false);
  //     setTimeout(() => setShow(false), 300);
  //   }
  // }, [openModal]);

  useEffect(() => {
    if (openModal) {
      setShow(true);

      // biarkan modal mount dulu
      const id = setTimeout(() => {
        setAnimate(true);
      }, 20);

      return () => clearTimeout(id);
    } else {
      setAnimate(false);

      const id = setTimeout(() => {
        setShow(false);
      }, 300);

      return () => clearTimeout(id);
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
        className={`mx-auto ${contentWidth} md:w-1/2 lg:max-w-2xl h-fit flex rounded-xl transition-all duration-300 ease-in-out ${
          animate ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

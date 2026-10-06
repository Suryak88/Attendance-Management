import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function HistoryBar({ children }) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    handleScroll();
  }, [children]);

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return;

    const scrollAmount = 150;
    scrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  return (
    <div className="flex flex-col py-2 bg-slate-100 border-t border-slate-400 my-2 relative">
      <div className="px-2 flex my-2">
        <p>Request History</p>
      </div>

      <div className="flex flex-1 relative">
        <div
          className={`flex items-center justify-center pointer-events-none absolute px-0.5 h-full left-0 w-10 z-25
             bg-linear-to-r from-slate-100 to-transparent transition-all duration-300 ease-in-out ${canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 scale-0 -translate-x-2"}`}
        >
          <button
            onClick={() => scrollByAmount("left")}
            className="flex items-center justify-center w-fit z-10 
               bg-white hover:bg-white shadow rounded-full p-1 pointer-events-auto"
          >
            <span>
              <ChevronLeft className="size-5" />
            </span>
          </button>
        </div>

        <div
          className={`flex items-center justify-center pointer-events-none absolute px-0.5 h-full right-0 w-10 z-25
             bg-linear-to-r from-transparent to-slate-100 transition-all duration-300 ease-in-out ${canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 scale-0 translate-x-2"}`}
        >
          <button
            onClick={() => scrollByAmount("right")}
            className="flex items-center justify-center w-fit z-10 
               bg-white hover:bg-white shadow rounded-full p-1 pointer-events-auto"
          >
            <span>
              <ChevronRight className="size-5" />
            </span>
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex flex-1 overflow-x-auto p-2 scroll-smooth"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

export function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    const update = () => setCanHover(mql.matches);

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return canHover;
}

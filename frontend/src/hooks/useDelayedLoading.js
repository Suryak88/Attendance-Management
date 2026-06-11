import { useRef, useState } from "react";

export function useDelayedLoading(delay = 120, minDuration = 180) {
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);

  const startLoading = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setLoading(true);
    }, delay);
  };

  const stopLoading = () => {
    clearTimeout(timerRef.current);

    if (!startRef.current) {
      setLoading(false);
      return;
    }

    const elapsed = Date.now() - startRef.current;
    const remaining = minDuration - elapsed;
    if (remaining > 0) {
      setTimeout(() => setLoading(false), remaining);
    } else {
      setLoading(false);
    }

    startRef.current = null;
  };

  return { loading, startLoading, stopLoading };
}

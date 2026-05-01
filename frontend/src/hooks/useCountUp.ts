import { useEffect, useState } from "react";

/** Smoothly counts up to `target` over `duration` ms. */
export function useCountUp(target: number, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const factor = Math.pow(10, decimals);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased * factor) / factor);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, decimals]);

  return value;
}

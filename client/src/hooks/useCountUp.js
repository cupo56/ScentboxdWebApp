import { useState, useEffect, useRef } from 'react';

/**
 * Animate a number from 0 → target with an ease-out curve.
 * Re-runs whenever `target` changes (e.g. once data loads).
 *
 * @param {number} target  final value
 * @param {number} duration animation length in ms (default 1200)
 */
export default function useCountUp(target = 0, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    // Nothing to animate toward — leave value as-is (counts only rise from 0).
    if (!target) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Jump straight to the target on the next frame (keeps setState out of the
    // synchronous effect body).
    if (reduced) {
      raf.current = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf.current);
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

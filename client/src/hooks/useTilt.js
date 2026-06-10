import { useRef, useEffect } from 'react';

/**
 * Interactive 3D tilt effect driven by pointer position.
 *
 * Returns a ref to attach to the target element. The hook wires up the pointer
 * listeners itself (inside an effect) and writes CSS custom properties that the
 * stylesheet maps onto a `transform: rotateX/rotateY` + a moving glare highlight:
 *   --tilt-rx, --tilt-ry  → rotation in degrees
 *   --glare-x, --glare-y  → glare hotspot position in %
 *
 * Disabled when the user prefers reduced motion or has a coarse pointer.
 *
 * @param {number} max maximum rotation in degrees (default 8)
 */
export default function useTilt(max = 8) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reducedMotion || !finePointer) return;

    let frame = 0;

    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * (max * 2);
        const rx = (0.5 - py) * (max * 2);

        el.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--tilt-rx', '0deg');
      el.style.setProperty('--tilt-ry', '0deg');
      el.style.setProperty('--glare-x', '50%');
      el.style.setProperty('--glare-y', '50%');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);

  return ref;
}

import { useEffect, useState } from 'react';

export default function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState('0');

  useEffect(() => {
    let rafId;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const numeric = Number(String(target).replace(/[^0-9.]/g, ''));

      if (Number.isNaN(numeric)) {
        setValue(target);
      } else {
        const current = numeric * (0.2 + progress * 0.8);
        setValue(String(target).includes('%') ? `${current.toFixed(2)}%` : `${Math.round(current)}`);
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}
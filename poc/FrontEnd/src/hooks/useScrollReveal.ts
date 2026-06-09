import { useEffect, useRef, useState } from "react";

export type RevealState = "reveal-up" | "reveal-down" | "visible";

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState>("reveal-up");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
        } else {
          const fromAbove = entry.boundingClientRect.top < 0;
          setState(fromAbove ? "reveal-down" : "reveal-up");
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, state };
}

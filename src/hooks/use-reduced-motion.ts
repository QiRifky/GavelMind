import { useSyncExternalStore } from "react";

const q = "(prefers-reduced-motion: reduce)";
/** True when the user asked the system for less motion. False during SSR. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(q);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(q).matches,
    () => false,
  );
}

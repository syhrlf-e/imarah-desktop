import { useState, useEffect } from "react";

/**
 * Tracks whether the user has scrolled beyond a given threshold
 * on the current window. Useful for glassmorphism header effects.
 *
 * @param thresholdPx - Scroll Y position (in pixels) at which `scrolled` becomes true. Default: 10.
 */
export function useScrollTracker(thresholdPx: number = 10) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > thresholdPx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [thresholdPx]);

  return { scrolled };
}

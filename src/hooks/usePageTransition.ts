/**
 * Reads the swipe direction from sessionStorage (set by BottomNav tap items)
 * and returns it as a number. Resets to 0 after each read cycle.
 *
 * Positive = swipe right, Negative = swipe left, 0 = no swipe.
 */
export function usePageTransition() {
  const getDirection = (): number => {
    if (typeof window !== "undefined") {
      const storedDir = sessionStorage.getItem("swipeDirection");
      return storedDir ? parseInt(storedDir, 10) : 0;
    }
    return 0;
  };

  return { direction: getDirection() };
}

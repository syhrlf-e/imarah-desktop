import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePageTransition } from "@/hooks/usePageTransition";

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps page content with framer-motion AnimatePresence and handles
 * directional swipe transitions based on sessionStorage state.
 *
 * Uses `popLayout` mode so that old page stays visible during exit animation.
 */
export default function PageTransitionWrapper({
  children,
}: PageTransitionWrapperProps) {
  const location = useLocation();
  const { direction } = usePageTransition();

  const pageKey = location.pathname.split("?")[0];

  const desktopVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <AnimatePresence
      custom={direction}
      mode="popLayout"
      onExitComplete={() => sessionStorage.setItem("swipeDirection", "0")}
    >
      <motion.div
        key={pageKey}
        custom={direction}
        variants={desktopVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.1,
          ease: "linear",
        }}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

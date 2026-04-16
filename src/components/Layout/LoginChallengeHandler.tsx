import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginChallengeModal from "@/components/LoginChallengeModal";
import { useLoginChallenge } from "@/hooks/useLoginChallenge";

interface LoginChallengeHandlerProps {
  userId: string;
}

/**
 * Handles the full login challenge lifecycle:
 *  - Detects incoming challenges via useLoginChallenge
 *  - Renders the challenge modal
 *  - Shows a rejection toast after user denies
 *
 * This component is self-contained and manages its own internal UI state.
 */
export default function LoginChallengeHandler({
  userId,
}: LoginChallengeHandlerProps) {
  const { activeChallenge, handleReject, handleApprove, clearChallenge } =
    useLoginChallenge(userId);

  const [showRejectedToast, setShowRejectedToast] = useState(false);

  const handleRejectWithToast = async (token: string) => {
    await handleReject(token);
    setShowRejectedToast(true);
    setTimeout(() => setShowRejectedToast(false), 3000);
  };

  return (
    <>
      {/* Rejection Toast */}
      <AnimatePresence>
        {showRejectedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-200
                       bg-slate-900 text-white text-sm font-medium
                       px-4 py-2 rounded-full shadow-lg"
          >
            ✕ Permintaan login telah ditolak
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Modal */}
      <AnimatePresence>
        {activeChallenge && (
          <LoginChallengeModal
            challenge={activeChallenge}
            onReject={() => handleRejectWithToast(activeChallenge.token)}
            onApprove={() => handleApprove(activeChallenge.token)}
            onExpired={clearChallenge}
          />
        )}
      </AnimatePresence>
    </>
  );
}

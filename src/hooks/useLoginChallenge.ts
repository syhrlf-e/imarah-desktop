import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { listen } from "@tauri-apps/api/event";

interface Challenge {
  token: string;
  expires_at: number;
}

export const useLoginChallenge = (userId: string | null) => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null,
  );
  // Set untuk mencegah token yang sudah ditolak muncul lagi
  const rejectedTokensRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Listen to Rust "incoming-challenge" event
    const unlistenIncoming = listen<Challenge>("incoming-challenge", (event) => {
        const challenge = event.payload;
        if (!rejectedTokensRef.current.has(challenge.token)) {
            setActiveChallenge(challenge);
        }
    });

    return () => {
        unlistenIncoming.then(fn => fn());
    };
  }, [userId]);

  const handleReject = async (token: string) => {
    rejectedTokensRef.current.add(token);
    setActiveChallenge(null);

    try {
      await api.post(`/auth/challenge/${token}/reject`);
    } catch (error) {
      console.error("Failed to reject challenge:", error);
    }
  };

  const handleApprove = async (token: string) => {
    setActiveChallenge(null);
    try {
      await api.post(`/auth/challenge/${token}/approve`);
    } catch (error) {
      console.error("Failed to approve challenge:", error);
    }
  };

  const clearChallenge = () => {
    setActiveChallenge(null);
  };

  return { activeChallenge, handleReject, handleApprove, clearChallenge };
};

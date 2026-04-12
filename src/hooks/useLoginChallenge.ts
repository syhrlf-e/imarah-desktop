import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface Challenge {
  token: string;
  expires_at: number;
}

export const useLoginChallenge = (userId: string | null) => {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    null,
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  // Set untuk mencegah token yang sudah ditolak muncul lagi
  const rejectedTokensRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // SSE disabled until API is configured - route() helper not available in Tauri SPA
    // const eventSource = new EventSource('/api/notifications/sse');
    // eventSourceRef.current = eventSource;
    // eventSource.addEventListener("challenge", (e: MessageEvent) => { ... });
    // eventSource.onerror = () => { ... };

    // cleanup placeholder (SSE disabled)
    return () => {};
  }, [userId]);

  const handleReject = async (token: string) => {
    rejectedTokensRef.current.add(token);
    setActiveChallenge(null);

    try {
      await api.post("/login-challenge/reject", { token });
    } catch (error) {
      console.error("Failed to reject challenge:", error);
    }
  };

  const handleApprove = async (token: string) => {
    setActiveChallenge(null);
    try {
      await api.post("/login-challenge/approve", { token });
    } catch (error) {
      console.error("Failed to approve challenge:", error);
    }
  };

  const clearChallenge = () => {
    setActiveChallenge(null);
  };

  return { activeChallenge, handleReject, handleApprove, clearChallenge };
};

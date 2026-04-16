import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

const HEARTBEAT_INTERVAL_MS = 120_000; // 2 minutes

/**
 * Polls the backend session heartbeat to detect if the user's session
 * has been invalidated (e.g. kicked out by admin, token revoked).
 *
 * Returns `isKickedOut` flag that becomes true on 401/403 responses.
 */
export function useSessionHeartbeat(intervalMs: number = HEARTBEAT_INTERVAL_MS) {
  const [isKickedOut, setIsKickedOut] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      await api.get("/session-heartbeat", {
        headers: { "X-Silent-Ping": "true" },
      });
    } catch (err: any) {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        setIsKickedOut(true);
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkSession, intervalMs);
    return () => clearInterval(intervalId);
  }, [checkSession, intervalMs]);

  return { isKickedOut };
}

import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

/**
 * Listens for the "session-revoked" event from Rust.
 * This event is emitted by the background worker when it detects 
 * an unauthorized or forbidden status during heartbeat polling.
 */
export function useSessionHeartbeat() {
  const [isKickedOut, setIsKickedOut] = useState(false);

  useEffect(() => {
    const unlisten = listen("session-revoked", () => {
      setIsKickedOut(true);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return { isKickedOut };
}

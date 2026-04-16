import { useEffect } from "react";
import api from "@/lib/api";

/**
 * Intercepts the Tauri window close request so that when the user
 * tries to close the app, it first sends a logout signal to the
 * backend before destroying the window.
 *
 * Only activates when running inside a Tauri environment.
 *
 * @param userId - Current user ID. No-op if falsy or 0 (guest).
 */
export function useTauriWindowClose(userId: string | number | undefined) {
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;

    const setupCloseHook = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const currentWindow = getCurrentWindow();

        const unlisten = await currentWindow.onCloseRequested(
          async (event) => {
            const isAuthenticated = userId && userId !== 0;

            if (isAuthenticated) {
              // Prevent immediate window close so we can logout gracefully
              event.preventDefault();

              try {
                await api.post("/auth/logout");
              } catch {
                console.warn(
                  "Logout signal API failed — proceeding with local cleanup.",
                );
              }

              // Force-kill the Tauri process after logout attempt
              currentWindow.destroy();
            }
          },
        );

        unlistenFn = unlisten;
      } catch {
        // Not in a Tauri environment — silently ignore
      }
    };

    setupCloseHook();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [userId]);
}

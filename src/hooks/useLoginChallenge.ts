import { useState, useEffect, useRef } from "react";
// router from inertia removed - API call used directly

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
        // Tandai token ini sebagai ditolak SEBELUM request — mencegah race condition dari SSE
        rejectedTokensRef.current.add(token);
        setActiveChallenge(null);

        try {
            await fetch('/api/login-challenge/reject', {
                method: "POST",
                body: JSON.stringify({ token }),
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-XSRF-TOKEN": decodeURIComponent(
                            document.cookie
                                .split("; ")
                                .find((c) => c.startsWith("XSRF-TOKEN="))
                                ?.split("=")[1] ?? "",
                        ),
                        Accept: "application/json",
                    },
                    credentials: "same-origin",
                },
            );
        } catch (error) {
            console.error("Failed to reject challenge:", error);
        }
    };

    const handleApprove = (token: string) => {
        // TODO: API call - POST /api/login-challenge/approve
        fetch('/api/login-challenge/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'same-origin',
        });
        setActiveChallenge(null);
    };

    const clearChallenge = () => {
        setActiveChallenge(null);
    };

    return { activeChallenge, handleReject, handleApprove, clearChallenge };
};

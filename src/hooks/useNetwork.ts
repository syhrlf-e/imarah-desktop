import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export function useNetwork() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Listen to Rust "network-status" event
        const unlisten = listen<string>("network-status", (event) => {
            setIsOnline(event.payload === "online");
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, []);

    return isOnline;
}

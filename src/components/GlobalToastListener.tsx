import { useEffect } from "react";
// import { usePage } from "@inertiajs/react";
import { toast } from "@/components/Toast";
// import { PageProps } from "@/types";

export default function GlobalToastListener() {
    // Mock flash until API is connected
    const flash = null as any;

    useEffect(() => {
        if (!flash) return;

        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
        if (flash.warning) {
            toast.warning(flash.warning);
        }
        if (flash.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    return null;
}

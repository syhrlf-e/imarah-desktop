import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export function useDate() {
    const [hijriDate, setHijriDate] = useState<string>("");
    
    useEffect(() => {
        try {
            const date = new Date();
            const format = new Intl.DateTimeFormat("id-TN-u-ca-islamic", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
            setHijriDate(format.replace(/ H$/i, "") + " H");
        } catch (e) {
            setHijriDate("Tanggal Hijriyah");
        }
    }, []);

    const masehiDateStr = dayjs().format("dddd, D MMMM YYYY");

    return { masehiDateStr, hijriDate };
}

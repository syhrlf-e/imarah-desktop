import { formatRupiah, parseRupiah } from "@/utils/formatter";
import { forwardRef, useEffect, useState } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: number;
    onValueChange: (value: number) => void;
    error?: string;
    isError?: boolean;
}

const RupiahInput = forwardRef<HTMLInputElement, Props>(
    (
        {
            value = 0,
            onValueChange,
            error,
            isError = false,
            className = "",
            ...props
        },
        ref,
    ) => {
        const [displayValue, setDisplayValue] = useState("");

        useEffect(() => {
            // Only update display value if the number value changes externally
            // and checking if it matches parsed display to avoid cursor jumps / formatting loops if we were careful,
            // but here simpler to just format always for "controlled" feel.
            if (value === 0 && displayValue === "") return; // Allow empty start if needed, but value is 0 default.

            // If the user typed "Rp 50.000", value is 50000.
            // If props.value updates to 60000, we want "Rp 60.000".
            // We use standard formatRupiah which might have prefix "Rp ".

            // Edge case: if value is 0, we might want to show "" or "Rp 0".
            // Let's assume standard behavior: always match prop.
            setDisplayValue(formatRupiah(value).replace(/^Rp\s?/, ""));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawInput = e.target.value;
            const numericValue = parseRupiah(rawInput);

            if (numericValue && numericValue.toString().length > 9) return;

            // Determine cursor position logic if needed, but for now simple controlled input
            // We update parent with numeric value
            onValueChange(numericValue);

            // We update local display immediately for responsiveness, usually formatted
            // But formatting on every keystroke can be annoying if it moves cursor.
            // A common strategy is to format on blur, or strictly format always.
            // Given "auto-format ke Rupiah saat mengetik", we format on change.
            setDisplayValue(formatRupiah(numericValue).replace(/^Rp\s?/, ""));
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            if (value === 0) setDisplayValue("");
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setDisplayValue(formatRupiah(value).replace(/^Rp\s?/, ""));
        };

        const hasError = !!error || !!isError;

        return (
            <div className={`relative w-full ${className}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span
                        className={`font-semibold ${hasError ? "text-red-500" : "text-slate-500"}`}
                    >
                        Rp
                    </span>
                </div>
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`block w-full pl-9 pr-3 py-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm font-semibold text-lg ${hasError ? "border-red-500 text-red-600 ring-1 ring-red-500/50" : ""} bg-white placeholder-slate-400`}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        );
    },
);

RupiahInput.displayName = "RupiahInput";

export default RupiahInput;

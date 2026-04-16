import { formatRupiah } from "@/utils/formatter";
import { forwardRef, useEffect, useState, useRef } from "react";

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
            disabled = false,
            ...props
        },
        ref,
    ) => {
        const [displayValue, setDisplayValue] = useState("");

        // Effect to format the initial value or when it changes from parent
        useEffect(() => {
            if (value === 0) {
                setDisplayValue("");
            } else {
                setDisplayValue(new Intl.NumberFormat("id-ID").format(value));
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/[^0-9]/g, "");

            if (rawValue.length > 9) return; // Max 9 digits (999.999.999)

            const numericValue = parseInt(rawValue, 10) || 0;
            onValueChange(numericValue);

            if (rawValue === "") {
                setDisplayValue("");
            } else {
                // Format with thousand separators for display
                setDisplayValue(new Intl.NumberFormat("id-ID").format(numericValue));
            }
        };

        const hasError = !!error || !!isError;

        // Base classes for the input
        const baseClasses = "block w-full pl-9 pr-3 py-2 border rounded-2xl shadow-sm font-semibold text-lg placeholder-slate-400 focus:outline-none";
        // State-specific classes
        const defaultClasses = "bg-white border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50";
        const errorClasses = "bg-white border-red-500 text-red-600 ring-1 ring-red-500";
        const disabledClasses = "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed";

        const combinedClasses = `${baseClasses} ${
            disabled ? disabledClasses : hasError ? errorClasses : defaultClasses
        }`;
        
        const rpClasses = `font-semibold text-lg ${
            disabled ? "text-slate-400" : hasError ? "text-red-500" : "text-slate-500"
        }`;

        return (
            <div className={`relative w-full ${className}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className={rpClasses}>
                        Rp
                    </span>
                </div>
                <input
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={displayValue}
                    onChange={handleChange}
                    className={combinedClasses}
                    disabled={disabled}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        );
    },
);

RupiahInput.displayName = "RupiahInput";

export default RupiahInput;

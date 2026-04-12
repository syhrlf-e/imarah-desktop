import { InputHTMLAttributes } from "react";

export default function Checkbox({
    className = "",
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                "rounded border-slate-300 text-green-500 shadow-sm focus:ring-green-500 " +
                className
            }
        />
    );
}

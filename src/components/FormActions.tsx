import React from "react";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

interface Props {
    onCancel: () => void;
    cancelText?: string;
    submitText?: string;
    loadingText?: string;
    processing?: boolean;
    submitDisabled?: boolean; // For additional disabled conditions like !isOnline
    layout?: "flex-end" | "full-width"; // flex-end (typical modal) or full-width (mobile-friendly flex-1)
    formId?: string; // Specify form ID if buttons are outside the <form> element
    className?: string; // Additional classes for the container
}

export default function FormActions({
    onCancel,
    cancelText = "Batal",
    submitText = "Simpan",
    loadingText = "Menyimpan...",
    processing = false,
    submitDisabled = false,
    layout = "flex-end",
    formId,
    className = "",
}: Props) {
    if (layout === "full-width") {
        return (
            <div className={`mt-6 flex gap-3 ${className}`}>
                <SecondaryButton
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1"
                >
                    {cancelText}
                </SecondaryButton>
                <PrimaryButton
                    form={formId}
                    disabled={processing || submitDisabled}
                    className="flex-1"
                >
                    {processing ? loadingText : submitText}
                </PrimaryButton>
            </div>
        );
    }

    // Default layout: flex-end
    return (
        <div
            className={`flex justify-end space-x-3 pt-4 border-t border-slate-100 ${className}`}
        >
            <SecondaryButton onClick={onCancel} disabled={processing}>
                {cancelText}
            </SecondaryButton>
            <PrimaryButton
                form={formId}
                disabled={processing || submitDisabled}
            >
                {processing ? loadingText : submitText}
            </PrimaryButton>
        </div>
    );
}

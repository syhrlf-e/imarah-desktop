import { Inbox, Plus } from "lucide-react";

interface Props {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800 mb-1">
                {message}
            </h3>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 inline-flex items-center justify-center px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-sm font-medium cursor-pointer"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

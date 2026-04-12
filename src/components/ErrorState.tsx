import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    message: string;
    onRetry?: () => void;
    title?: string;
}

export default function ErrorState({
    message,
    onRetry,
    title = "Terjadi Kesalahan",
}: Props) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
            <p className="text-red-600 mb-6 max-w-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                </button>
            )}
        </div>
    );
}

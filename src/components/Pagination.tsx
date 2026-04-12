import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LinkItem {
    url: string | null;
    label: string;
    active: boolean;
}

interface Meta {
    links: LinkItem[];
    from: number;
    to: number;
    total: number;
}

interface PaginationProps {
    meta: Meta;
    prevPageUrl: string | null;
    nextPageUrl: string | null;
    cleanHtmlEntities?: (str: string) => string;
}

export default function Pagination({
    meta,
    prevPageUrl,
    nextPageUrl,
    cleanHtmlEntities = (str: string) =>
        str
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/&amp;/g, "&")
            .replace(/Previous/g, "")
            .replace(/Next/g, ""),
}: PaginationProps) {
    const navigate = useNavigate();
    if (!meta || meta.total === 0) return null;

    return (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 font-medium">
                Menampilkan{" "}
                <span className="text-slate-900 font-semibold">
                    {meta.from || 0}
                </span>{" "}
                -{" "}
                <span className="text-slate-900 font-semibold">
                    {meta.to || 0}
                </span>{" "}
                dari{" "}
                <span className="text-slate-900 font-semibold">
                    {meta.total || 0}
                </span>{" "}
                data
            </div>

            <div className="flex space-x-2">
                {prevPageUrl ? (
                    <button
                        onClick={() => navigate(prevPageUrl)}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        aria-label="Halaman Sebelumnya"
                    >
                        <ChevronLeft size={16} />
                    </button>
                ) : (
                    <span className="p-2 border border-slate-200 rounded-lg text-slate-300 bg-slate-50/50 cursor-not-allowed">
                        <ChevronLeft size={16} />
                    </span>
                )}

                <div className="hidden sm:flex space-x-1 mx-2">
                    {meta.links
                        .filter(
                            (l) =>
                                !l.label.includes("Previous") &&
                                !l.label.includes("Next") &&
                                cleanHtmlEntities(l.label) !== "",
                        )
                        .map((link, idx) =>
                            link.url ? (
                                <button
                                    key={idx}
                                    onClick={() =>
                                        navigate(link.url as string)
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                        link.active
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-600 hover:bg-slate-200 bg-slate-100/50"
                                    }`}
                                >
                                    {cleanHtmlEntities(link.label)}
                                </button>
                            ) : (
                                <span
                                    key={idx}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                        link.active
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {cleanHtmlEntities(link.label)}
                                </span>
                            ),
                        )}
                </div>

                {nextPageUrl ? (
                    <button
                        onClick={() => navigate(nextPageUrl)}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        aria-label="Halaman Berikutnya"
                    >
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <span className="p-2 border border-slate-200 rounded-lg text-slate-300 bg-slate-50/50 cursor-not-allowed">
                        <ChevronRight size={16} />
                    </span>
                )}
            </div>
        </div>
    );
}

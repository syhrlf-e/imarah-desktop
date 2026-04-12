export function SkeletonCard() {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-slate-200">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
            <div className="divide-y divide-slate-200">
                {[...Array(rows)].map((_, i) => (
                    <div
                        key={i}
                        className="px-6 py-4 flex items-center justify-between"
                    >
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

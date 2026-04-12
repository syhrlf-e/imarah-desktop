import { Link } from "react-router-dom";

export default function ErrorPage({ status = 404 }: { status?: number }) {
    const title: Record<number, string> = {
        503: "Layanan Tidak Tersedia",
        500: "Kesalahan Server",
        404: "Halaman Tidak Ditemukan",
        403: "Akses Ditolak",
    };

    const description: Record<number, string> = {
        503: "Maaf, layanan kami sedang dalam pemeliharaan. Silakan coba kembali beberapa saat lagi.",
        500: "Oops, terjadi kesalahan internal pada server kami. Tim teknis sedang meninjaunya.",
        404: "Maaf, halaman atau rute yang Anda tuju tidak dapat kami temukan.",
        403: "Maaf, Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.",
    };

    const displayTitle = title[status] || "Terjadi Kesalahan";
    const displayDescription =
        description[status] || "Terjadi kesalahan sistem yang tidak diketahui.";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans px-6 text-center">
            <div className="mb-6 relative">
                <h1 className="text-[120px] leading-none font-black text-slate-200/60 tracking-tighter select-none">
                    {status}
                </h1>
            </div>

            <div className="space-y-4 max-w-md z-10 -mt-12 bg-white/40 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {displayTitle}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    {displayDescription}
                </p>
                <div className="pt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
                    >
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}

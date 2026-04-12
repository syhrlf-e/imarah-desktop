import React from "react";
import AppLayout from "@/layouts/AppLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageProps } from "@/types";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataTable, { ColumnDef } from "@/components/DataTable";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
    id: string;
    amount: number;
    notes: string | null;
    created_at: string;
    tromol_box?: {
        id: string;
        name: string;
    };
    creator?: {
        id: string;
        name: string;
    };
}

interface PaginationData {
    data: Transaction[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

const EMPTY_PAGE: PaginationData = { data: [], links: [], from: 0, to: 0, total: 0, current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null };

export default function TromolHistory({
    transactions: transactionsProp,
}: { transactions?: PaginationData }) {
    const transactions = transactionsProp ?? EMPTY_PAGE;
    const [searchParams, setSearchParams] = useSearchParams();
    const handlePageNav = (direction: number, url: string | null) => {
        if (!url) return;
        const newUrl = new URL(url);
        setSearchParams(new URLSearchParams(newUrl.search));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const cleanHtmlEntities = (str: string) => {
        if (!str) return "";
        return str
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/&amp;/g, "&")
            .replace(/Previous/g, "")
            .replace(/Next/g, "");
    };

    return (
        <AppLayout title="Tromol">
            {/* Header Section */}
            <PageHeader
                title="Riwayat Setoran Tromol"
                description="Pencatatan histori penerimaan infaq dari kotak tromol dan kotak QRIS."
            >
                <Link
                    to="/tromol"
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Kembali ke Daftar Tromol
                </Link>
            </PageHeader>

            {/* Main Content Area */}
            <DataTable
                className="flex-1 min-h-[400px]"
                tableFixed
                columns={
                    [
                        {
                            key: "tanggal",
                            header: "Tanggal & Waktu",
                            cellClassName:
                                "whitespace-nowrap text-slate-600 font-medium",
                            render: (trx) =>
                                new Date(trx.created_at).toLocaleString(
                                    "id-ID",
                                    {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    },
                                ),
                        },
                        {
                            key: "tromol",
                            header: "Kotak Tromol",
                            cellClassName: "whitespace-nowrap",
                            render: (trx) => (
                                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                    {trx.tromol_box?.name || "-"}
                                </span>
                            ),
                        },
                        {
                            key: "petugas",
                            header: "Petugas Input",
                            cellClassName: "whitespace-nowrap",
                            render: (trx) => (
                                <div className="flex items-center text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold mr-2">
                                        {(trx.creator?.name || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    {trx.creator?.name || "Sistem"}
                                </div>
                            ),
                        },
                        {
                            key: "catatan",
                            header: "Catatan",
                            cellClassName: "text-slate-600 max-w-xs truncate",
                            render: (trx) =>
                                trx.notes || (
                                    <span className="italic text-slate-400">
                                        -
                                    </span>
                                ),
                        },
                        {
                            key: "nominal",
                            header: "Nominal Setoran",
                            headerClassName: "text-right",
                            cellClassName:
                                "whitespace-nowrap text-right font-bold text-green-600 text-base",
                            render: (trx) => `+ ${formatCurrency(trx.amount)}`,
                        },
                    ] satisfies ColumnDef<(typeof transactions.data)[0]>[]
                }
                data={transactions.data}
                keyExtractor={(row) => row.id}
                emptyState={
                    <div className="flex flex-col items-center justify-center text-slate-400 py-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="font-medium text-slate-600">
                            Belum ada riwayat setoran
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Data setoran dari kolektor kotak tromol akan muncul
                            di sini.
                        </p>
                    </div>
                }
            />

            {/* Pagination */}
            {transactions.last_page > 1 && (
                <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                    <span className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">
                            {transactions.total}
                        </span>{" "}
                        data{" · Halaman "}
                        <span className="font-semibold text-slate-800">
                            {transactions.current_page}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-800">
                            {transactions.last_page}
                        </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={!transactions.prev_page_url}
                            onClick={() =>
                                handlePageNav(-1, transactions.prev_page_url)
                            }
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <AnimatePresence mode="popLayout">
                            {[
                                transactions.current_page - 1,
                                transactions.current_page,
                                transactions.current_page + 1,
                            ]
                                .filter(
                                    (p) =>
                                        p >= 1 && p <= transactions.last_page,
                                )
                                .map((p) => (
                                    <motion.button
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            if (p === transactions.current_page)
                                                return;
                                            handlePageNav(
                                                p > transactions.current_page
                                                    ? 1
                                                    : -1,
                                                p > transactions.current_page
                                                    ? transactions.next_page_url
                                                    : transactions.prev_page_url,
                                            );
                                        }}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                                            p === transactions.current_page
                                                ? "bg-green-600 text-white border-green-600 cursor-default"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                    >
                                        {p}
                                    </motion.button>
                                ))}
                        </AnimatePresence>

                        <button
                            type="button"
                            disabled={!transactions.next_page_url}
                            onClick={() =>
                                handlePageNav(1, transactions.next_page_url)
                            }
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

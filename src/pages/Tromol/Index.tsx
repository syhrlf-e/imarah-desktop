import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { PageProps } from "@/types";
import {
    Box,
    QrCode,
    MapPin,
    Activity,
    Plus,
    History,
    ArrowUpDown,
    SlidersHorizontal,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import PrimaryButton from "@/components/PrimaryButton";

import { useTromolData, TromolBox } from "@/hooks/api/useTromol";

export default function TromolIndex() {
    const { data: tromolBoxes = [], isLoading: loading } = useTromolData();
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");

    // Pemrosesan Filter Client-side
    const filteredBoxes = tromolBoxes
        .filter((box) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                box.name.toLowerCase().includes(q) ||
                box.qr_code.toLowerCase().includes(q) ||
                (box.location || "").toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            // Sort Alphabet
            if (sortAlpha === "a-z") {
                const cmp = a.name.localeCompare(b.name);
                if (cmp !== 0) return cmp;
            } else if (sortAlpha === "z-a") {
                const cmp = b.name.localeCompare(a.name);
                if (cmp !== 0) return cmp;
            }

            // Sort Tanggal
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === "terbaru" ? dateB - dateA : dateA - dateB;
        });
    return (
        <AppLayout title="Pengelola Tromol">
            {/* Header Section */}
            <PageHeader
                title="Kotak Tromol & Amal"
                description="Daftar dan status kotak tromol fisik maupun QRIS digital."
            >
                <PrimaryButton
                    className="!py-2.5 font-medium cursor-not-allowed hidden-sm h-11"
                    title="Fitur akan datang"
                    disabled
                >
                    <Plus className="w-5 h-5" />
                    Tambah Kotak Tromol
                </PrimaryButton>
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari kotak tromol..."
                searchValue={search}
                onSearchChange={setSearch}
            >
                <button
                    type="button"
                    onClick={() =>
                        setSortAlpha(sortAlpha === "a-z" ? "z-a" : "a-z")
                    }
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                    {sortAlpha === "a-z" ? "A-Z" : "Z-A"}
                </button>
                <button
                    type="button"
                    onClick={() =>
                        setSortOrder(
                            sortOrder === "terbaru" ? "terlama" : "terbaru",
                        )
                    }
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                    <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                    {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                </button>
            </FilterBar>

            {loading ? (
                <div className="flex justify-center items-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBoxes.map((box) => (
                    <div
                        key={box.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full relative"
                    >
                        {/* Decorative top border */}
                        <div
                            className={`h-1 w-full ${box.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`}
                        ></div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className={`p-3 rounded-xl ${box.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                                    >
                                        <Box className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                            {box.name}
                                        </h4>
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                                    box.status === "active"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                        : "bg-slate-100 text-slate-600 border-slate-200/50"
                                                }`}
                                            >
                                                {box.status === "active" ? (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                                                        Aktif
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>{" "}
                                                        Nonaktif
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Action dropdown or buttons could go here */}
                            </div>

                            <div className="mt-auto space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-start text-sm text-slate-600">
                                    <MapPin className="w-4 h-4 mr-2.5 mt-0.5 text-slate-400 shrink-0" />
                                    <span className="leading-tight">
                                        {box.location || (
                                            <span className="italic text-slate-400">
                                                Lokasi belum ditentukan
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Activity className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                                    <span>
                                        Kode:{" "}
                                        <span className="font-mono ml-1 font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                            {box.qr_code}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col flex-row gap-3">
                                {box.status === "active" && (
                                    <a
                                        href={box.signed_url || "#"}
                                        className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Scan QR
                                    </a>
                                )}
                                <Link
                                    to="/tromol/history"
                                    className={`inline-flex justify-center items-center px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors ${box.status !== "active" ? "w-full" : "flex-1"}`}
                                >
                                    <History className="w-4 h-4 mr-2 text-slate-400" />
                                    Riwayat
                                </Link>
                            </div>
                        </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredBoxes.length === 0 && tromolBoxes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                    Tidak ada kotak tromol yang sesuai dengan kriteria pencarian.
                </div>
            )}

            {!loading && tromolBoxes.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Box className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                        Daftar Tromol Kosong
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mb-6">
                        Belum ada kotak tromol atau amal yang tercatat di dalam
                        sistem.
                    </p>
                </div>
            )}
        </AppLayout>
    );
}

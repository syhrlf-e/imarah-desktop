import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useAuth } from "@/contexts/AuthContext";
import { useAgendaData, useAgendaMutation } from "@/hooks/api/useAgenda";
import {
    Plus,
    Edit2,
    Trash2,
    Calendar as CalendarIcon,
    MapPin,
    ArrowUpDown,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "@/components/PrimaryButton";
import DangerButton from "@/components/DangerButton";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import AgendaFormModal from "./components/AgendaFormModal";

dayjs.locale("id");

interface User {
    id: string;
    name: string;
}

interface Agenda {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string | null;
    location: string | null;
    type: "kajian" | "rapat" | "kegiatan_sosial" | "lainnya";
    speaker_name: string | null;
    status: "terjadwal" | "berlangsung" | "selesai" | "batal";
    created_at: string;
    creator?: User;
}

const EMPTY_DATA = { items: [], meta: { current_page: 1, last_page: 1, total: 0 } };

export default function AgendaIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") ?? "";
    const sortOrder = searchParams.get("order") ?? "terbaru";
    const sortAlpha = searchParams.get("sort") ?? "a-z";
    const page = searchParams.get("page") ?? "1";

    const { data: agendaRes, isLoading } = useAgendaData(searchParams.toString());
    const { remove } = useAgendaMutation();

    const data = agendaRes || EMPTY_DATA;
    const agendaItems: Agenda[] = data.items || [];
    const meta = data.meta;

    const { user } = useAuth();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localSearch, setLocalSearch] = useState(search);

    const [hijriDate, setHijriDate] = useState<string>("");

    const getHijriDateString = () => {
        try {
            const date = new Date();
            const format = new Intl.DateTimeFormat("id-TN-u-ca-islamic", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }).format(date);
            return format.replace(/ H$/i, "") + " H";
        } catch (e) {
            return "Tanggal Hijriyah";
        }
    };

    useEffect(() => {
        setHijriDate(getHijriDateString());
    }, []);

    const masehiDateStr = dayjs().format("dddd, D MMMM YYYY");

    const applyFilters = useCallback(
        (params: { search?: string; sort?: string; order?: string; page?: string }) => {
            const nextParams = new URLSearchParams(searchParams);
            if (params.search !== undefined) nextParams.set("search", params.search);
            if (params.sort !== undefined) nextParams.set("sort", params.sort);
            if (params.order !== undefined) nextParams.set("order", params.order);
            if (params.page !== undefined) nextParams.set("page", params.page);
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: val, page: "1" });
        }, 500);
    };

    const handlePageNav = (direction: 1 | -1) => {
        const nextPage = parseInt(page as string) + direction;
        if (nextPage >= 1 && nextPage <= meta.last_page) {
             applyFilters({ page: nextPage.toString() });
        }
    };

    const openAddModal = () => {
        setEditingAgenda(null);
        setIsAddOpen(true);
    };

    const openEditModal = (agenda: Agenda) => {
        setEditingAgenda(agenda);
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus agenda ini?")) {
            await remove.mutateAsync(id);
        }
    };

    const typeStyles = {
        kajian: "bg-blue-50 text-blue-700 border-blue-200/50",
        rapat: "bg-purple-50 text-purple-700 border-purple-200/50",
        kegiatan_sosial: "bg-orange-50 text-orange-700 border-orange-200/50",
        lainnya: "bg-slate-100 text-slate-700 border-slate-200/50",
    };

    const formatDisplayDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const formatDisplayTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const canManage = ["super_admin", "bendahara"].includes(user?.role ?? "");

    return (
        <AppLayout title="Pengelola Agenda">
            <PageHeader
                title="Agenda Masjid"
                description="Kelola jadwal kajian, rapat, dan kegiatan komunitas di masjid."
            >
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                    <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                </div>
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari agenda kegiatan..."
                searchValue={localSearch}
                onSearchChange={handleSearchChange}
            >
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => applyFilters({ sort: sortAlpha === "a-z" ? "z-a" : "a-z", page: "1" })}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
                        {sortAlpha === "a-z" ? "A-Z" : "Z-A"}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFilters({ order: sortOrder === "terbaru" ? "terlama" : "terbaru", page: "1" })}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-400" />
                        {sortOrder === "terbaru" ? "Terbaru" : "Terlama"}
                    </button>

                    {canManage && (
                        <>
                            <div className="h-6 w-px bg-slate-200 mx-1" />
                            <button
                                onClick={openAddModal}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer"
                            >
                                Buat Agenda
                            </button>
                        </>
                    )}
                </div>
            </FilterBar>

            {isLoading ? (
                <div className="flex-1 min-h-[400px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200">
                     <span className="text-slate-400">Loading...</span>
                </div>
            ) : (
                <div className="flex-1 min-h-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="min-w-full text-sm text-left align-middle">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Waktu</th>
                                    <th scope="col" className="px-6 py-4">Agenda</th>
                                    <th scope="col" className="px-6 py-4">Pemateri</th>
                                    <th scope="col" className="px-6 py-4">Kategori</th>
                                    <th scope="col" className="px-6 py-4">Lokasi</th>
                                    <th scope="col" className="px-6 py-4">Status</th>
                                    {canManage && (
                                        <th scope="col" className="px-6 py-4 text-right pr-6">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {agendaItems.length > 0 ? (
                                    agendaItems.map((agenda) => (
                                        <tr key={agenda.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                <div className="flex items-start">
                                                    <CalendarIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-slate-700">{formatDisplayDate(agenda.start_time)}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {formatDisplayTime(agenda.start_time)}
                                                            {agenda.end_time && ` - ${formatDisplayTime(agenda.end_time)}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800 mb-1">{agenda.title}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]" title={agenda.description || ""}>
                                                    {agenda.description || <span className="italic">Tidak ada deskripsi</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {agenda.speaker_name ? (
                                                    <span className="font-medium">{agenda.speaker_name}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum diisi</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 max-w-xs">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${typeStyles[agenda.type]} capitalize`}>
                                                    {agenda.type?.replace(/_/g, " ") || "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 max-w-xs">
                                                {agenda.location ? (
                                                    <div className="flex items-start">
                                                        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                                        <span className="truncate" title={agenda.location}>{agenda.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum diisi</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                                                    agenda.status === 'terjadwal' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    agenda.status === 'berlangsung' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    agenda.status === 'selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {agenda.status || 'terjadwal'}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditModal(agenda)}
                                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit Agenda"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {user?.role === "super_admin" && (
                                                            <DangerButton
                                                                onClick={() => handleDelete(agenda.id)}
                                                                className="p-1.5 h-auto text-red-500 bg-transparent shadow-none hover:bg-red-50 rounded-lg transition-colors border-none"
                                                                title="Hapus Agenda"
                                                            >
                                                                <Trash2 size={18} />
                                                            </DangerButton>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={canManage ? 7 : 6} className="py-12">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada agenda</h3>
                                                <p className="text-sm text-slate-500 max-w-sm mb-6">
                                                    Jadwal kajian dan kegiatan masih kosong. Tambahkan agenda baru untuk mulai menginformasikan kegiatan ke jamaah.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {meta.last_page > 1 && (
                <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                    <span className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">{meta.total}</span> data{" · Halaman "}
                        <span className="font-semibold text-slate-800">{meta.current_page}</span> dari{" "}
                        <span className="font-semibold text-slate-800">{meta.last_page}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => handlePageNav(-1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <AnimatePresence mode="popLayout">
                            {[meta.current_page - 1, meta.current_page, meta.current_page + 1]
                                .filter((p) => p >= 1 && p <= meta.last_page)
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
                                            if (p !== meta.current_page) applyFilters({ page: p.toString() });
                                        }}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
                                            p === meta.current_page
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
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() => handlePageNav(1)}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <AgendaFormModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                editingAgenda={editingAgenda}
            />
        </AppLayout>
    );
}

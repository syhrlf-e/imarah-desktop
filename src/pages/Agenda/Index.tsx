import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "@/layouts/AppLayout";
import api from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { PageProps } from "@/types";
import {
    Plus,
    Edit2,
    Trash2,
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Search,
    ArrowUpDown,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "@/components/CustomSelect";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import DangerButton from "@/components/DangerButton";
import TextInput from "@/components/TextInput";
import InputLabel from "@/components/InputLabel";
import InputError from "@/components/InputError";
import FilterBar from "@/components/FilterBar";
import PageHeader from "@/components/PageHeader";
import FormActions from "@/components/FormActions";

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
    created_at: string;
    creator?: User;
}

interface PaginationData {
    data: Agenda[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}


let agendaCache: Agenda[] = [];
let agendaCacheReady = false;

export default function AgendaIndex() {
    const [agendaItems, setAgendaItems] = useState<Agenda[]>(agendaCache);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(!agendaCacheReady);
    const user = { role: 'super_admin' as const };
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">(
        "terbaru",
    );
    const [sortAlpha, setSortAlpha] = useState<"a-z" | "z-a">("a-z");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);

    const handlePageNav = (direction: number, url: string | null) => {
        if (!url) return;
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get("page");
        
        const nextParams = new URLSearchParams(searchParams);
        if (search) nextParams.set('search', search);
        if (sortAlpha) nextParams.set('sort', sortAlpha);
        if (sortOrder) nextParams.set('order', sortOrder);
        if (page) nextParams.set('page', page);
        
        setSearchParams(nextParams, { replace: true });
    };

    const [data, setDataForm] = useState({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        location: "",
        type: "kajian" as "kajian" | "rapat" | "kegiatan_sosial" | "lainnya",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));
    const reset = () => setDataForm({ title: "", description: "", start_time: "", end_time: "", location: "", type: "kajian" });

    const [searchParams, setSearchParams] = useSearchParams();

    const openAddModal = () => {
        setEditingAgenda(null);
        reset();
        setIsAddOpen(true);
    };

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
        } catch {
            return "";
        }
    };

    const openEditModal = (agenda: Agenda) => {
        setEditingAgenda(agenda);
        setDataForm({
            title: agenda.title,
            description: agenda.description || "",
            start_time: formatDateForInput(agenda.start_time),
            end_time: agenda.end_time
                ? formatDateForInput(agenda.end_time)
                : "",
            location: agenda.location || "",
            type: agenda.type,
        });
        setIsAddOpen(true);
    };

    const closeModal = () => {
        setIsAddOpen(false);
        setTimeout(() => {
            setEditingAgenda(null);
            reset();
        }, 200);
    };

    const fetchAgenda = useCallback(async () => {
        try {
            const res = await api.get('/agenda');
            const d = res.data?.data;
            if (d?.agendas?.items) {
                agendaCache = d.agendas.items;
                agendaCacheReady = true;
                setAgendaItems(d.agendas.items);
                setMeta({ current_page: d.agendas.meta?.current_page ?? 1, last_page: d.agendas.meta?.last_page ?? 1, total: d.agendas.meta?.total ?? 0 });
            }
        } catch (err) {
            console.error('Gagal memuat agenda:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAgenda(); }, [fetchAgenda]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingAgenda) {
                await api.put(`/agenda/${editingAgenda.id}`, data);
            } else {
                await api.post('/agenda', data);
            }
            closeModal();
            fetchAgenda();
        } catch(err: any) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus agenda ini?")) {
            try {
                await api.delete(`/agenda/${id}`);
                fetchAgenda();
            } catch (err) {
                console.error('Gagal hapus agenda:', err);
            }
        }
    };

    // Removed cleanHtmlEntities function as per instruction

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

    return (
        <AppLayout title="Pengelola Agenda">
            {/* Header Section */}
            <PageHeader
                title="Agenda Masjid"
                description="Kelola jadwal kajian, rapat, dan kegiatan komunitas di masjid."
            >
                {agendaItems.length > 0 &&
                    [
                        "super_admin",
                        "bendahara",
                        "petugas_zakat",
                    ].includes(user.role) && (
                        <PrimaryButton
                            onClick={openAddModal}
                            className="!py-2.5 font-medium cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Buat Agenda
                        </PrimaryButton>
                    )}
            </PageHeader>

            <FilterBar
                searchPlaceholder="Cari agenda kegiatan..."
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
            {/* Main Content Area */}
            <div className="flex-1 min-h-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full text-sm text-left align-middle">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
                            <tr>
                                <th scope="col" className="px-6 py-4">
                                    Agenda
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Kategori
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Waktu
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Lokasi
                                </th>
                                {[
                                    "super_admin",
                                    "bendahara",
                                    "petugas_zakat",
                                ].includes(user.role) && (
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-right pr-6"
                                    >
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                            {agendaItems.length > 0 ? (
                                agendaItems.map((agenda) => (
                                    <tr
                                        key={agenda.id}
                                        className="bg-white hover:bg-slate-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 mb-1">
                                                {agenda.title}
                                            </div>
                                            <div
                                                className="text-xs text-slate-500 truncate max-w-[200px]"
                                                title={agenda.description || ""}
                                            >
                                                {agenda.description || (
                                                    <span className="italic">
                                                        Tidak ada deskripsi
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeStyles[agenda.type]} capitalize`}
                                            >
                                                {agenda.type.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            <div className="flex items-start">
                                                <CalendarIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                                <div>
                                                    <div className="font-medium text-slate-700">
                                                        {formatDisplayDate(
                                                            agenda.start_time,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {formatDisplayTime(
                                                            agenda.start_time,
                                                        )}
                                                        {agenda.end_time &&
                                                            ` - ${formatDisplayTime(agenda.end_time)}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs">
                                            {agenda.location ? (
                                                <div className="flex items-start">
                                                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400 shrink-0" />
                                                    <span
                                                        className="truncate"
                                                        title={agenda.location}
                                                    >
                                                        {agenda.location}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">
                                                    Belum diisi
                                                </span>
                                            )}
                                        </td>
                                        {[
                                            "super_admin",
                                            "bendahara",
                                            "petugas_zakat",
                                        ].includes(user.role) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                agenda,
                                                            )
                                                        }
                                                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit Agenda"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    {user.role ===
                                                        "super_admin" && (
                                                        <DangerButton
                                                            onClick={() =>
                                                                handleDelete(
                                                                    agenda.id,
                                                                )
                                                            }
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
                                    <td
                                        colSpan={
                                            [
                                                "super_admin",
                                                "bendahara",
                                                "petugas_zakat",
                                            ].includes(user.role)
                                                ? 5
                                                : 4
                                        }
                                        className="py-12"
                                    >
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <CalendarIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1">
                                                Belum ada agenda
                                            </h3>
                                            <p className="text-sm text-slate-500 max-w-sm mb-6">
                                                Jadwal kajian dan kegiatan masih
                                                kosong.Tambahkan agenda baru
                                                untuk mulai menginformasikan
                                                kegiatan ke jamaah.
                                            </p>
                                            {[
                                                "super_admin",
                                                "bendahara",
                                                "petugas_zakat",
                                            ].includes(user.role) && (
                                                <PrimaryButton
                                                    onClick={openAddModal}
                                                    className="inline-flex items-center justify-center !py-2.5 font-medium cursor-pointer"
                                                >
                                                    <Plus className="w-5 h-5 mr-1" />
                                                    Buat Agenda
                                                </PrimaryButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-row items-center justify-between gap-3 mt-2 shrink-0">
                    <span className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">
                            {meta.total}
                        </span>{" "}
                        data{" · Halaman "}
                        <span className="font-semibold text-slate-800">
                            {meta.current_page}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-slate-800">
                            {meta.last_page}
                        </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() => fetchAgenda()}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <AnimatePresence mode="popLayout">
                            {[
                                meta.current_page - 1,
                                meta.current_page,
                                meta.current_page + 1,
                            ]
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
                                            if (p === meta.current_page) return;
                                            fetchAgenda();
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
                            onClick={() => fetchAgenda()}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Add/Edit */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>

                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingAgenda
                                    ? "Edit Agenda Kegiatan"
                                    : "Tambah Agenda Baru"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form
                                onSubmit={handleSubmit}
                                id="agenda-form"
                                className="space-y-4"
                            >
                                <div>
                                    <InputLabel
                                        value="Judul Agenda *"
                                        className="mb-1.5"
                                    />
                                    <TextInput
                                        value={data.title}
                                        onChange={(e) =>
                                            setData("title", e.target.value)
                                        }
                                        placeholder="Misal: Kajian Rutin Ba'da Subuh"
                                        required
                                        isFocused={isAddOpen || !!editingAgenda}
                                    />
                                    <InputError
                                        message={errors.title}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel
                                            value="Waktu Mulai *"
                                            className="mb-1.5"
                                        />
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={data.start_time}
                                                onChange={(e) =>
                                                    setData(
                                                        "start_time",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm bg-white"
                                                required
                                            />
                                        </div>
                                        <InputError
                                            message={errors.start_time}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value="Waktu Selesai"
                                            className="mb-1.5"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={data.end_time}
                                            onChange={(e) =>
                                                setData(
                                                    "end_time",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm bg-white"
                                        />
                                        <InputError
                                            message={errors.end_time}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel
                                            value="Tipe Kegiatan *"
                                            className="mb-1.5"
                                        />
                                        <CustomSelect
                                            value={data.type}
                                            onChange={(val) =>
                                                setData("type", val as any)
                                            }
                                            options={[
                                                {
                                                    value: "kajian",
                                                    label: "Kajian",
                                                },
                                                {
                                                    value: "rapat",
                                                    label: "Rapat",
                                                },
                                                {
                                                    value: "kegiatan_sosial",
                                                    label: "Kegiatan Sosial",
                                                },
                                                {
                                                    value: "lainnya",
                                                    label: "Lainnya",
                                                },
                                            ]}
                                        />
                                        <InputError
                                            message={errors.type}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value="Lokasi"
                                            className="mb-1.5"
                                        />
                                        <TextInput
                                            value={data.location}
                                            onChange={(e) =>
                                                setData(
                                                    "location",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Masjid Utama / Zoom"
                                        />
                                        <InputError
                                            message={errors.location}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel
                                        value="Deskripsi Kegiatan"
                                        className="mb-1.5"
                                    />
                                    <textarea
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm resize-none bg-white placeholder:text-slate-400"
                                        rows={3}
                                        placeholder="Ceritakan detail kegiatan atau tambahkan catatan khusus..."
                                    ></textarea>
                                    <InputError
                                        message={errors.description}
                                        className="mt-1"
                                    />
                                </div>
                            </form>
                        </div>

                        <FormActions
                            onCancel={closeModal}
                            processing={processing}
                            formId="agenda-form"
                            submitText="Simpan Agenda"
                            layout="full-width"
                            className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 mt-0"
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

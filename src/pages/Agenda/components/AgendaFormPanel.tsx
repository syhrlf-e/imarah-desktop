import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAgendaMutation } from "@/hooks/api/useAgenda";
import CustomSelect from "@/components/CustomSelect";
import TextInput from "@/components/TextInput";
import InputLabel from "@/components/InputLabel";
import InputError from "@/components/InputError";
import FormActions from "@/components/FormActions";

interface User {
    id: string;
    name: string;
}

interface Agenda {
    id:string;
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

interface AgendaFormPanelProps {
    isOpen: boolean;
    onClose: () => void;
    editingAgenda: Agenda | null;
}

export default function AgendaFormPanel({ isOpen, onClose, editingAgenda }: AgendaFormPanelProps) {
    const { store, update } = useAgendaMutation();
    const [data, setDataForm] = useState({
        title: "",
        speaker_name: "",
        description: "",
        start_time: "",
        end_time: "",
        location: "",
        type: "kajian" as "kajian" | "rapat" | "kegiatan_sosial" | "lainnya",
        status: "terjadwal" as "terjadwal" | "berlangsung" | "selesai" | "batal",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

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

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setProcessing(false);
            if (editingAgenda) {
                setDataForm({
                    title: editingAgenda.title,
                    speaker_name: editingAgenda.speaker_name || "",
                    description: editingAgenda.description || "",
                    start_time: formatDateForInput(editingAgenda.start_time),
                    end_time: editingAgenda.end_time ? formatDateForInput(editingAgenda.end_time) : "",
                    location: editingAgenda.location || "",
                    type: editingAgenda.type,
                    status: editingAgenda.status,
                });
            } else {
                setDataForm({
                    title: "",
                    speaker_name: "",
                    description: "",
                    start_time: "",
                    end_time: "",
                    location: "",
                    type: "kajian",
                    status: "terjadwal",
                });
            }
        }
    }, [isOpen, editingAgenda]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const formatToUTC = (dateStr: string) => {
                if (!dateStr) return null;
                return new Date(dateStr).toISOString().replace("T", " ").substring(0, 19);
            };

            const payload = {
                ...data,
                start_time: formatToUTC(data.start_time) || data.start_time,
                end_time: formatToUTC(data.end_time),
                location: data.location ? data.location : null,
                description: data.description ? data.description : null,
            };

            if (editingAgenda) {
                await update.mutateAsync({ id: editingAgenda.id, data: payload });
            } else {
                await store.mutateAsync(payload);
            }
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                setErrors(errData.errors);
            } else {
                setErrors({ submit: errData?.message || "Gagal menyimpan agenda." });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 top-9 bg-slate-900/30 backdrop-blur-[2px] z-40"
                        onClick={onClose}
                    ></motion.div>

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed top-12 right-0 bottom-4 bg-white w-140 shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200"
                    >
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingAgenda ? "Edit Agenda Kegiatan" : "Tambah Agenda Baru"}
                            </h3>
                        </div>

                        <div className="p-5 sm:p-6 pb-safe flex-1 overflow-y-auto bg-white min-h-0">
                            <form id="agenda-form" onSubmit={handleSubmit} className="space-y-4">
                                {errors.submit && (
                                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">
                                        {errors.submit}
                                    </div>
                                )}
                                <div>
                                    <InputLabel value="Judul Agenda *" className="mb-1.5" />
                                    <TextInput
                                        value={data.title}
                                        onChange={(e) => setData("title", e.target.value)}
                                        placeholder="Misal: Kajian Rutin Ba'da Subuh"
                                        required
                                        isFocused={true}
                                    />
                                    <InputError message={errors.title} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value="Nama Pemateri / Pengisi" className="mb-1.5" />
                                    <TextInput
                                        value={data.speaker_name}
                                        onChange={(e) => setData("speaker_name", e.target.value)}
                                        placeholder="Contoh: Ustadz Syafiq Riza / KH. Abdullah Gymnastiar"
                                    />
                                    <InputError message={errors.speaker_name} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Waktu Mulai *" className="mb-1.5" />
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={data.start_time}
                                                onChange={(e) => setData("start_time", e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm bg-white"
                                                required
                                            />
                                        </div>
                                        <InputError message={errors.start_time} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Waktu Selesai" className="mb-1.5" />
                                        <input
                                            type="datetime-local"
                                            value={data.end_time}
                                            onChange={(e) => setData("end_time", e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm bg-white"
                                        />
                                        <InputError message={errors.end_time} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel value="Tipe Kegiatan *" className="mb-1.5" />
                                        <CustomSelect
                                            value={data.type}
                                            onChange={(val) => setData("type", val as any)}
                                            options={[
                                                { value: "kajian", label: "Kajian" },
                                                { value: "rapat", label: "Rapat" },
                                                { value: "kegiatan_sosial", label: "Kegiatan Sosial" },
                                                { value: "lainnya", label: "Lainnya" },
                                            ]}
                                        />
                                        <InputError message={errors.type} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Status *" className="mb-1.5" />
                                        <CustomSelect
                                            value={data.status}
                                            onChange={(val) => setData("status", val as any)}
                                            options={[
                                                { value: "terjadwal", label: "Terjadwal" },
                                                { value: "berlangsung", label: "Sedang Berlangsung" },
                                                { value: "selesai", label: "Selesai" },
                                                { value: "batal", label: "Dibatalkan" },
                                            ]}
                                        />
                                        <InputError message={errors.status} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Lokasi" className="mb-1.5" />
                                        <TextInput
                                            value={data.location}
                                            onChange={(e) => setData("location", e.target.value)}
                                            placeholder="Contoh: Masjid Utama"
                                        />
                                        <InputError message={errors.location} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Deskripsi Kegiatan" className="mb-1.5" />
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData("description", e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 text-sm shadow-sm resize-none bg-white placeholder:text-slate-400"
                                        rows={3}
                                        placeholder="Ceritakan detail kegiatan atau tambahkan catatan khusus..."
                                    ></textarea>
                                    <InputError message={errors.description} className="mt-1" />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-safe rounded-bl-2xl">
                            <FormActions
                                onCancel={onClose}
                                processing={processing}
                                formId="agenda-form"
                                submitText="Simpan Agenda"
                                layout="full-width"
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

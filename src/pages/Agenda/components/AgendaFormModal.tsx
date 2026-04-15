import React, { useState, useEffect } from "react";
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

interface AgendaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAgenda: Agenda | null;
}

export default function AgendaFormModal({ isOpen, onClose, editingAgenda }: AgendaFormModalProps) {
    const { store, update } = useAgendaMutation();
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
                    description: editingAgenda.description || "",
                    start_time: formatDateForInput(editingAgenda.start_time),
                    end_time: editingAgenda.end_time ? formatDateForInput(editingAgenda.end_time) : "",
                    location: editingAgenda.location || "",
                    type: editingAgenda.type,
                });
            } else {
                setDataForm({
                    title: "",
                    description: "",
                    start_time: "",
                    end_time: "",
                    location: "",
                    type: "kajian",
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingAgenda ? "Edit Agenda Kegiatan" : "Tambah Agenda Baru"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
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

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 mt-0">
                    <FormActions
                        onCancel={onClose}
                        processing={processing}
                        formId="agenda-form"
                        submitText="Simpan Agenda"
                        layout="full-width"
                        className="mt-0!"
                    />
                </div>
            </div>
        </div>
    );
}

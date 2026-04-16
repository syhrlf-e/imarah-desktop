import { ChevronLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMuzakkiMutation } from "@/hooks/api/useZakat";
import { useNetwork } from "@/hooks/useNetwork";
import FormActions from "@/components/FormActions";
import InputLabel from "@/components/InputLabel";
import TextInput from "@/components/TextInput";
import InputError from "@/components/InputError";
import CustomSelect from "@/components/CustomSelect";

interface Muzakki {
    id: string;
    name: string;
    jenis_kelamin: "L" | "P";
    jumlah_tanggungan: number;
    phone: string | null;
    alamat: string | null;
    rt: string | null;
    rw: string | null;
    is_active: boolean | number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    muzakki?: Muzakki | null;
}

export default function MuzakkiFormPanel({ isOpen, onClose, muzakki }: Props) {
    const isOnline = useNetwork();
    const { store, update } = useMuzakkiMutation(muzakki?.id);

    const [data, setDataForm] = useState({
        name: "",
        jenis_kelamin: "L" as "L" | "P",
        jumlah_tanggungan: "" as string | number,
        phone: "08",
        alamat: "",
        rt: "",
        rw: "",
        is_active: true as boolean,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

    const reset = () => setDataForm({
        name: "",
        jenis_kelamin: "L",
        jumlah_tanggungan: "",
        phone: "08",
        alamat: "",
        rt: "",
        rw: "",
        is_active: true,
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            setProcessing(false);
            if (muzakki) {
                setDataForm({
                    name: muzakki.name || "",
                    jenis_kelamin: muzakki.jenis_kelamin || "L",
                    jumlah_tanggungan: muzakki.jumlah_tanggungan || 0,
                    phone: muzakki.phone || "08",
                    alamat: muzakki.alamat || "",
                    rt: muzakki.rt || "",
                    rw: muzakki.rw || "",
                    is_active: !!muzakki.is_active,
                });
            } else {
                reset();
            }
        }
    }, [muzakki, isOpen]);

    const clearErrors = () => setErrors({});
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "");

        if (!val.startsWith("08")) {
            if (val.startsWith("8")) {
                val = "0" + val;
            } else {
                val = "08" + val;
            }
        }

        if (val.length > 13) {
            val = val.slice(0, 13);
        }

        setData("phone", val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (data.phone.length < 10) {
            setError("phone", "Nomor HP minimal 10 digit.");
            return;
        }

        setProcessing(true);
        clearErrors();

        const payload = {
            ...data,
            jumlah_tanggungan: data.jumlah_tanggungan === "" ? 0 : Number(data.jumlah_tanggungan),
        };

        try {
            const action = muzakki ? update.mutateAsync(payload) : store.mutateAsync(payload);
            await action;
            onClose();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([key, msgs]) => {
                    setError(key, (msgs as string[])[0]);
                });
            } else {
                setError("form", errData?.message ?? "Gagal menyimpan data.");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed inset-0 top-left bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose}></motion.div>
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed top-12 right-0 bottom-4 bg-white w-140 shadow-2xl flex flex-col z-50 rounded-tl-2xl rounded-bl-2xl border-l border-slate-200">
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white z-10 rounded-tl-2xl">
                            <button onClick={onClose} className="p-2 text-slate-500 transition-colors bg-slate-100 rounded-full hover:text-slate-800 hover:bg-slate-200"><ChevronLeft className="w-5 h-5" /></button>
                            <h3 className="text-lg font-bold text-slate-900">{muzakki ? "Edit Muzakki" : "Daftarkan Muzakki"}</h3>
                        </div>

                        <div className="flex-1 min-h-0 p-5 overflow-y-auto bg-white sm:p-6 pb-safe">
                            <form id="muzakki-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Nama Lengkap *" />
                                    <TextInput id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} className="block w-full mt-1" placeholder="Contoh: Abdullah" isFocused={isOpen} />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="jenis_kelamin" value="Jenis Kelamin *" />
                                        <div className="mt-1">
                                            <CustomSelect value={data.jenis_kelamin} onChange={(val) => setData("jenis_kelamin", val)} options={[{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }]} />
                                        </div>
                                        <InputError message={errors.jenis_kelamin} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="jumlah_tanggungan" value="Jumlah Tanggungan *" />
                                        <TextInput id="jumlah_tanggungan" type="text" inputMode="numeric" value={data.jumlah_tanggungan} onChange={(e) => setData("jumlah_tanggungan", e.target.value.replace(/\D/g, "").slice(0, 3))} className="block w-full mt-1" placeholder="0" />
                                        <InputError message={errors.jumlah_tanggungan} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Nomor HP (WhatsApp) *" />
                                    <TextInput id="phone" type="text" inputMode="tel" value={data.phone} onChange={handlePhoneChange} className="block w-full mt-1" placeholder="08..." />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-3">
                                        <InputLabel htmlFor="alamat" value="Alamat" />
                                        <TextInput id="alamat" value={data.alamat} onChange={(e) => setData("alamat", e.target.value)} className="block w-full mt-1" placeholder="Jl. Mawar..." />
                                        <InputError message={errors.alamat} className="mt-2" />
                                    </div>
                                    <div className="flex-1">
                                        <InputLabel htmlFor="rt" value="RT" />
                                        <TextInput id="rt" value={data.rt} onChange={(e) => setData("rt", e.target.value.replace(/\D/g, "").slice(0, 3))} className="block w-full mt-1 text-center" placeholder="00" />
                                        <InputError message={errors.rt} className="mt-2" />
                                    </div>
                                    <div className="flex-1">
                                        <InputLabel htmlFor="rw" value="RW" />
                                        <TextInput id="rw" value={data.rw} onChange={(e) => setData("rw", e.target.value.replace(/\D/g, "").slice(0, 3))} className="block w-full mt-1 text-center" placeholder="00" />
                                        <InputError message={errors.rw} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="is_active" value="Status Keanggotaan *" />
                                    <div className="mt-1">
                                        <CustomSelect value={data.is_active ? "1" : "0"} onChange={(val) => setData("is_active", val === "1")} options={[{ value: "1", label: "Aktif" }, { value: "0", label: "Nonaktif" }]} />
                                    </div>
                                    <InputError message={errors.is_active} className="mt-2" />
                                </div>

                                {errors.form && <InputError message={errors.form} className="mt-2" />}
                            </form>
                        </div>
                        <div className="p-5 bg-white border-t border-slate-100 sm:p-6 shrink-0 pb-safe rounded-bl-2xl">
                            <FormActions onCancel={onClose} processing={processing} submitDisabled={!isOnline} layout="full-width" submitText="Simpan Data" formId="muzakki-form" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

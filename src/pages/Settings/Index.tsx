import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import api from "@/lib/api";
import {
    Settings,
    Building2,
    Phone,
    MapPin,
    Calculator,
    Save,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

import { useSettingsData, useSettingsMutation } from "@/hooks/api/useSettings";
import { toast } from "sonner";

export default function SettingsIndex() {
    const { data: serverSettings, isLoading: loadingSettings } = useSettingsData();
    const { update } = useSettingsMutation();
    
    const [data, setDataForm] = useState({
        settings: {
            masjid_name: "Sistem Manajemen Masjid",
            masjid_address: "",
            contact_phone: "",
            zakat_fitrah_amount: "40000",
        },
    });
    
    // Sinkronisasi data awal dari React Query state ke lokal form state
    useEffect(() => {
        if (serverSettings && Object.keys(serverSettings).length > 0) {
            setDataForm({ settings: serverSettings });
        }
    }, [serverSettings]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await update.mutateAsync(data.settings);
            toast.success("Pengaturan berhasil disimpan");
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([k, msgs]) =>
                    setErrors(prev => ({ ...prev, [k]: (msgs as string[])[0] }))
                );
            } else {
                toast.error(errData?.message || "Gagal menyimpan pengaturan");
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout title="Pengelola Pengaturan">
            {/* Header Section */}
            <PageHeader
                title="Pengaturan Sistem"
                description="Kelola profil masjid dan parameter dasar aplikasi."
            />

            <div className="max-w-4xl">
                {loadingSettings ? (
                    <div className="flex justify-center items-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profil Masjid Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Building2 className="w-5 h-5 mr-2 text-green-600" />
                                Profil Masjid Utama
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Informasi ini akan ditampilkan di kop laporan
                                dan kuitansi.
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                        Nama Masjid
                                    </label>
                                    <input
                                        type="text"
                                        value={data.settings.masjid_name}
                                        onChange={(e) =>
                                            setData("settings", {
                                                ...data.settings,
                                                masjid_name: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-colors"
                                        placeholder="Misal: Masjid Jami' Al-Ikhlas"
                                    />
                                    {errors?.["settings.masjid_name"] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                                            {errors["settings.masjid_name"]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                        Nomor Kontak / WA DKM
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={data.settings.contact_phone}
                                            onChange={(e) =>
                                                setData("settings", {
                                                    ...data.settings,
                                                    contact_phone:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-colors"
                                            placeholder="Misal: 081234567890"
                                        />
                                    </div>
                                    {errors?.["settings.contact_phone"] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                                            {errors["settings.contact_phone"]}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                        Alamat Lengkap
                                    </label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                            <MapPin className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <textarea
                                            value={data.settings.masjid_address}
                                            onChange={(e) =>
                                                setData("settings", {
                                                    ...data.settings,
                                                    masjid_address:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-colors resize-none"
                                            rows={3}
                                            placeholder="Masukkan alamat lengkap masjid..."
                                        />
                                    </div>
                                    {errors?.["settings.masjid_address"] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                                            {errors["settings.masjid_address"]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Parameter Keuangan Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                                Parameter Keuangan & Zakat
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Pengaturan khusus variabel keuangan dan
                                kalkulator zakat.
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Ketetapan Zakat Fitrah{" "}
                                        <span className="text-slate-500 font-normal">
                                            (Rp / Jiwa)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-medium sm:text-sm">
                                                Rp
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                data.settings
                                                    .zakat_fitrah_amount
                                            }
                                            onChange={(e) =>
                                                setData("settings", {
                                                    ...data.settings,
                                                    zakat_fitrah_amount:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm shadow-sm transition-colors font-medium text-slate-900"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                                        <span className="w-1 h-1 rounded-full bg-slate-400 mr-1.5"></span>
                                        Nominal acuan beras/uang untuk 1 jiwa
                                        per tahun
                                    </p>
                                    {errors?.[
                                        "settings.zakat_fitrah_amount"
                                    ] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">
                                            {
                                                errors[
                                                    "settings.zakat_fitrah_amount"
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end pt-2 space-x-4">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-green-500 border border-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>Menyimpan...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Pengaturan
                                </>
                            )}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </AppLayout>
    );
}

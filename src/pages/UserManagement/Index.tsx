import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { useNavigate } from "react-router-dom";
import { PageProps, User } from "@/types";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CustomSelect from "@/components/CustomSelect";
import PrimaryButton from "@/components/PrimaryButton";
import {
    Plus,
    Search,
    ShieldCheck,
    Mail,
    AlertTriangle,
    ShieldAlert,
    KeyRound,
    Key,
    Shield,
    Info,
    CopyX,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "@/components/Toast";

interface Props {
    auth?: PageProps['auth'];
    users?: User[];
    flash?: Record<string, string>;
}

import { useUsersData, useUsersMutation } from "@/hooks/api/useUsers";

export default function Index() {
    const { user: authUser } = useAuth();
    const auth = { user: authUser ?? { id: '', name: 'Admin', role: 'super_admin' } as User };
    
    const { data: users = [], isLoading: loadingUsers } = useUsersData();
    const { create, remove } = useUsersMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [data, setDataForm] = useState<{
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role: "super_admin" | "bendahara" | "petugas_zakat" | "sekretaris" | "viewer";
        seckey: string;
    }>({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "petugas_zakat",
        seckey: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));
    const clearErrors = (...keys: string[]) => setErrors(prev => {
        const next = { ...prev };
        keys.length ? keys.forEach(k => delete next[k]) : Object.keys(next).forEach(k => delete next[k]);
        return next;
    });
    const reset = () => setDataForm({ name: "", email: "", password: "", password_confirmation: "", role: "petugas_zakat", seckey: "" });

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await create.mutateAsync(data);
            toast.success("Pengguna berhasil ditambahkan");
            closeModal();
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                Object.entries(errData.errors).forEach(([k, msgs]) =>
                    setError(k, (msgs as string[])[0])
                );
            } else {
                toast.error(errData?.message || "Gagal menambahkan pengguna");
            }
        } finally {
            setProcessing(false);
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        reset();
        clearErrors();
    };

    const handleDelete = async (user: User) => {
        if (
            confirm(
                `Peringatan: Tarik akses dan blokir permanen akun "${user.name}"? Orang tersebut akan otomatis dikeluarkan dari aplikasi.`,
            )
        ) {
            try {
                await remove.mutateAsync(user.id);
                toast.success("Akses pengguna berhasil dicabut");
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mencabut akses");
                console.error('Gagal hapus user:', err);
            }
        }
    };

    return (
        <AppLayout title="Manajemen Pengguna">
            <div className="flex flex-col h-full bg-slate-50">

                {/* Toolbar Island */}
                <div className="px-4 md:px-8 pt-4 md:pt-8 mb-4 relative z-10">
                    <div className="bg-white p-4 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 flex flex-col flex-row gap-4 items-center justify-between backdrop-blur-xl bg-white/90">
                        {/* Title (Desktop) */}
                        <div className="block">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-poppins flex items-center gap-2">
                                <ShieldCheck className="text-emerald-500" />{" "}
                                Manajemen Pengguna
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Atur hak akses staf dan admin secara terpusat.
                            </p>
                        </div>

                        {/* Search & Actions */}
                        <div className="flex flex-col flex-row w-full md:w-auto gap-3 items-center">
                            <div className="relative w-full sm:w-64 group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari nama atau email..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-sm transition-all duration-200"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm flex items-center justify-center cursor-pointer"
                            >
                                Tambah Staf
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="flex-1 px-4 md:px-8 pb-8 md:pb-12 overflow-hidden flex flex-col relative z-0">
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/60 flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-md">
                                        <th className="px-6 py-4 rounded-tl-3xl">
                                            Nama Staf
                                        </th>
                                        <th className="px-6 py-4">
                                            Alamat Email
                                        </th>
                                        <th className="px-6 py-4">
                                            Peran (Role)
                                        </th>
                                        <th className="px-6 py-4 text-right rounded-tr-3xl">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                    {loadingUsers ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-emerald-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                            {user.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-700">
                                                            {user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                            user.role ===
                                                            "super_admin"
                                                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                : user.role ===
                                                                    "bendahara"
                                                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                  : user.role ===
                                                                      "sekretaris"
                                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        }`}
                                                    >
                                                        {user.role ===
                                                        "super_admin"
                                                            ? "Super Admin"
                                                            : user.role ===
                                                                "bendahara"
                                                              ? "Bendahara"
                                                              : user.role ===
                                                                  "sekretaris"
                                                                ? "Sekretaris"
                                                                : "Petugas Zakat"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {user.id !== auth.user.id &&
                                                    user.role !==
                                                        "super_admin" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user,
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium"
                                                        >
                                                            <Trash2 size={14} />{" "}
                                                            Cabut Akses
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300 italic text-xs">
                                                            Dilindungi
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-slate-500"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
                                                    <p className="text-base font-medium text-slate-900">
                                                        Tidak ada staf ditemukan
                                                    </p>
                                                    <p className="text-sm mt-1">
                                                        Pencarian "{searchQuery}
                                                        " tidak ada di sistem.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Pengguna */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm pt-0 sm:pt-10">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <Shield className="text-emerald-500" />{" "}
                                    Daftar Akun Baru
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Isi formulir untuk mendata staf Imarah.
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto overflow-x-hidden pwa-scroll">
                            <form
                                onSubmit={submit}
                                className="flex flex-col gap-5"
                            >
                                {/* Email Input */}
                                <div className="relative group">
                                    <input
                                        type="email"
                                        id="email"
                                        className={`block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent border-2 rounded-xl appearance-none focus:outline-none focus:ring-0 peer transition-colors ${
                                            errors.email
                                                ? "border-red-400 focus:border-red-500"
                                                : "border-slate-200 focus:border-emerald-500"
                                        }`}
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        placeholder=" "
                                        required
                                    />
                                    <label
                                        htmlFor="email"
                                        className={`absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 ${
                                            errors.email
                                                ? "text-red-500 peer-focus:text-red-500"
                                                : "text-slate-500 peer-focus:text-emerald-600"
                                        }`}
                                    >
                                        Alamat Email Valid
                                    </label>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500 ml-1">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Name Input */}
                                <div className="relative group">
                                    <input
                                        type="text"
                                        id="name"
                                        className={`block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent border-2 rounded-xl appearance-none focus:outline-none focus:ring-0 peer transition-colors ${
                                            errors.name
                                                ? "border-red-400 focus:border-red-500"
                                                : "border-slate-200 focus:border-emerald-500"
                                        }`}
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        placeholder=" "
                                        required
                                    />
                                    <label
                                        htmlFor="name"
                                        className={`absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 ${
                                            errors.name
                                                ? "text-red-500 peer-focus:text-red-500"
                                                : "text-slate-500 peer-focus:text-emerald-600"
                                        }`}
                                    >
                                        Nama Lengkap
                                    </label>
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-500 ml-1">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Role Select */}
                                <div className="relative group pt-2">
                                    <label
                                        className={`absolute text-sm z-[10] transform -translate-y-3 scale-75 top-4 origin-[0] left-4 pointer-events-none ${
                                            errors.role
                                                ? "text-red-500"
                                                : "text-emerald-600"
                                        }`}
                                    >
                                        Pilih Peran Staf
                                    </label>
                                    <CustomSelect
                                        value={data.role}
                                        onChange={(val) =>
                                            setData("role", val as any)
                                        }
                                        className={`pt-6 pb-2 border-2 ${
                                            errors.role
                                                ? "border-red-400 focus:border-red-500"
                                                : "border-slate-200 focus:border-emerald-500"
                                        }`}
                                        options={[
                                            {
                                                value: "petugas_zakat",
                                                label: "Petugas Zakat (Hanya Input ZISWAF)",
                                            },
                                            {
                                                value: "bendahara",
                                                label: "Bendahara (Akses Penuh Arus Kas Masjid)",
                                            },
                                            {
                                                value: "sekretaris",
                                                label: "Sekretaris (Agenda & Laporan)",
                                            },
                                        ]}
                                    />
                                    {errors.role && (
                                        <p className="mt-1 text-xs text-red-500 ml-1">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div className="relative group">
                                    <input
                                        type="password"
                                        id="password"
                                        className={`block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent border-2 rounded-xl appearance-none focus:outline-none focus:ring-0 peer transition-colors ${
                                            errors.password
                                                ? "border-red-400 focus:border-red-500"
                                                : "border-slate-200 focus:border-emerald-500"
                                        }`}
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder=" "
                                        required
                                    />
                                    <label
                                        htmlFor="password"
                                        className={`absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 ${
                                            errors.password
                                                ? "text-red-500 peer-focus:text-red-500"
                                                : "text-slate-500 peer-focus:text-emerald-600"
                                        }`}
                                    >
                                        Sandi Baru (Min 8 Karakter)
                                    </label>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-500 ml-1">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Input */}
                                <div className="relative group">
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        className="block w-full px-4 pt-6 pb-2 text-sm text-slate-900 bg-transparent border-2 border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-emerald-500 peer transition-colors"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value,
                                            )
                                        }
                                        placeholder=" "
                                        required
                                    />
                                    <label
                                        htmlFor="password_confirmation"
                                        className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-600"
                                    >
                                        Ulangi Sandi
                                    </label>
                                </div>

                                {/* THE SECRET ADMIN CODE INPUT (No Visible Label) */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="relative group">
                                        <input
                                            type="password"
                                            className="block w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-0 focus:border-purple-300 focus:bg-white transition-colors"
                                            value={data.seckey}
                                            onChange={(e) =>
                                                setData(
                                                    "seckey",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder=" " /* Kosong dan Rahasia */
                                            required
                                        />
                                        {errors.seckey && (
                                            <p className="mt-1 text-xs text-red-500 ml-1">
                                                {errors.seckey}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-300 mt-1 italic text-right">
                                            Otoritas Enkripsi Kunci Diperlukan
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? "Memproses..." : "Daftarkan Akun"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

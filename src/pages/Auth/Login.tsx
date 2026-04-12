import Checkbox from "@/components/Checkbox";
import InputError from "@/components/InputError";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import GuestLayout from "@/layouts/GuestLayout";
import { useNavigate } from "react-router-dom";
import { FormEventHandler, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export default function Login({ status }: { status?: string }) {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    // Jika sudah login (ada user di context), langsung ke dashboard
    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, loading, navigate]);
    const [data, setDataForm] = useState({
        email: "",
        password: "",
        remember: false as boolean,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const setData = (key: string, value: any) => setDataForm(prev => ({ ...prev, [key]: value }));
    const setError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));
    const clearErrors = (...keys: string[]) => setErrors(prev => {
        const next = { ...prev };
        if (keys.length) {
            keys.forEach(k => delete next[k]);
        } else {
            return {};
        }
        return next;
    });
    const reset = (...keys: string[]) => {
        if (keys.includes("password")) setDataForm(prev => ({ ...prev, password: "" }));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        clearErrors();

        let hasError = false;

        if (!data.email) {
            setError("email", "Alamat email wajib diisi");
            hasError = true;
        } else {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(data.email)) {
                setError("email", "Email yang Anda masukkan tidak sesuai");
                hasError = true;
            }
        }

        if (!data.password) {
            setError("password", "Kata sandi wajib diisi");
            hasError = true;
        }

        if (hasError) return;

        setProcessing(true);
        try {
            const response = await api.post("/auth/login", {
                email: data.email,
                password: data.password,
            });

            const resData = response.data;

            // Handle concurrent session challenge (status: 202)
            if (resData.status === "challenge") {
                navigate("/login/waiting", {
                    state: { challengeToken: resData.data.challenge_token },
                });
                return;
            }

            // Login sukses — simpan token dan user ke context
            login(resData.data.token, resData.data.user);
            navigate("/dashboard");
        } catch (error: any) {
            const errData = error?.response?.data;
            if (errData?.errors) {
                // Validasi Laravel (422) — field-level errors
                Object.entries(errData.errors).forEach(([key, msgs]) => {
                    setError(key, (msgs as string[])[0]);
                });
            } else if (errData?.message) {
                setError("email", errData.message);
            } else {
                setError("email", "Gagal terhubung ke server. Pastikan backend berjalan.");
            }
        } finally {
            setProcessing(false);
            reset("password");
        }
    };

    return (
        <GuestLayout>
            {status && (
                <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
                    {status}
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-xl px-10 py-12 shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:rounded-[2rem] border border-white/60 ring-1 ring-slate-900/5 transition-all">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
                        Imarah
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        Sistem Manajemen Masjid Digital Terpadu
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <div className="relative">
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={`peer block w-full px-4 pt-6 pb-2 rounded-xl bg-slate-50 focus:bg-white transition-colors shadow-sm text-sm ${
                                    errors.email
                                        ? "!border-red-500 focus:!ring-2 focus:!ring-red-500/20 focus:!border-red-500 !ring-1 !ring-red-500"
                                        : "!border-slate-200 focus:!ring-2 focus:!ring-emerald-500/20 focus:!border-emerald-500"
                                }`}
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => {
                                    const val = e.target.value
                                        .toLowerCase()
                                        .replace(/\s/g, "");
                                    setData("email", val);
                                    if (errors.email && val.length >= 3)
                                        clearErrors("email");
                                }}
                                placeholder=" "
                            />
                            <label
                                htmlFor="email"
                                className={`absolute left-4 top-2 -translate-y-0 text-[11px] font-semibold transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold cursor-text pointer-events-none ${
                                    errors.email
                                        ? "text-red-500 peer-focus:text-red-500"
                                        : "text-emerald-600 peer-focus:text-emerald-600"
                                }`}
                            >
                                Alamat Email
                            </label>
                        </div>

                        <InputError message={errors.email} className="mt-2 ml-1" />
                    </div>

                    <div>
                        <div className="relative">
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className={`peer block w-full px-4 pt-6 pb-2 rounded-xl bg-slate-50 focus:bg-white transition-colors shadow-sm text-sm ${
                                    errors.password
                                        ? "!border-red-500 focus:!ring-2 focus:!ring-red-500/20 focus:!border-red-500 !ring-1 !ring-red-500"
                                        : "!border-slate-200 focus:!ring-2 focus:!ring-emerald-500/20 focus:!border-emerald-500"
                                }`}
                                autoComplete="current-password"
                                onChange={(e) => {
                                    setData("password", e.target.value);
                                    if (
                                        errors.password &&
                                        e.target.value.length >= 3
                                    )
                                        clearErrors("password");
                                }}
                                placeholder=" "
                            />
                            <label
                                htmlFor="password"
                                className={`absolute left-4 top-2 -translate-y-0 text-[11px] font-semibold transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold cursor-text pointer-events-none ${
                                    errors.password
                                        ? "text-red-500 peer-focus:text-red-500"
                                        : "text-emerald-600 peer-focus:text-emerald-600"
                                }`}
                            >
                                Kata Sandi
                            </label>
                        </div>

                        <InputError
                            message={errors.password}
                            className="mt-2 ml-1"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer group">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData(
                                        "remember",
                                        (e.target.checked || false) as false,
                                    )
                                }
                                className="rounded border-slate-200 text-emerald-600 shadow-sm focus:!ring-0 focus:!ring-offset-0 focus:outline-none w-5 h-5 cursor-pointer outline-none"
                            />
                            <span className="ms-3 text-sm text-slate-500 group-hover:text-slate-800 transition-colors">
                                Ingat saya
                            </span>
                        </label>
                    </div>

                    <div>
                        <PrimaryButton
                            className="w-full justify-center py-3.5 mt-2 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-lg hover:shadow-emerald-500/30 focus:!ring-0 focus:outline-none disabled:opacity-70"
                            disabled={processing}
                        >
                            Masuk Ke Dashboard
                        </PrimaryButton>
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
                <p className="font-poppins tracking-wide">
                    © {new Date().getFullYear()} Imarah. Hak Cipta Dilindungi.
                </p>
            </div>
        </GuestLayout>
    );
}

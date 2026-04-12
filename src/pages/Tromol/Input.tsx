import { FormEventHandler, useState } from "react";
import { formatRupiah, parseRupiah } from "@/utils/formatter";
import { TromolBox, User } from "@/types";
import { Box, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";

interface Props {
    tromolBox?: TromolBox;
    auth?: {
        user: User;
    };
}

const DEFAULT_BOX: TromolBox = { id: '', name: 'Kotak Tromol', qr_code: '', location: null, status: 'active', created_at: '' };
const DEFAULT_AUTH = { user: { id: '', name: 'Petugas', role: 'petugas_zakat' } as User };

export default function TromolInput({ tromolBox: boxProp, auth: authProp }: Props) {
    const tromolBox = boxProp ?? DEFAULT_BOX;
    const auth = authProp ?? DEFAULT_AUTH;
    const [data, setData] = useState({ amount: 0 });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);

    const [formattedAmount, setFormattedAmount] = useState("");

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numberVal = parseRupiah(val);
        setData({ amount: numberVal });
        setFormattedAmount(formatRupiah(numberVal));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // TODO: call API route correctly
            // await fetch(window.location.href, { method: "POST" })
            setWasSuccessful(true);
            setFormattedAmount("");
        } catch (error) {
            setErrors({ amount: "Gagal menyimpan data" });
        } finally {
            setProcessing(false);
        }
    };

    if (wasSuccessful) {
        return (
            <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Alhamdulillah!
                </h1>
                <p className="text-slate-500 mb-8 max-w-xs">
                    Infaq Tromol <strong>{tromolBox.name}</strong> berhasil
                    dicatat.
                </p>
                <div className="space-y-3 w-full max-w-xs">
                    {/* In a real app, this might redirect to scanning another QR code */}
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 flex items-center justify-center"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Input Lagi
                    </button>
                    <a
                        href="/dashboard"
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center"
                    >
                        Ke Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-6 shadow-sm flex flex-col items-center pt-10 pb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                    <Box size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 text-center">
                    {tromolBox.name}
                </h1>
                <p className="text-sm text-slate-500 flex items-center mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {tromolBox.location || "Lokasi tidak spesifik"}
                </p>
                <p className="text-xs text-slate-400 mt-4">
                    Petugas: {auth.user.name}
                </p>
            </div>

            {/* Form Area */}
            <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                <form onSubmit={submit} className="w-full space-y-6">
                    <div>
                        <label
                            htmlFor="amount"
                            className="block text-center text-sm font-medium text-slate-500 mb-4"
                        >
                            Masukkan Jumlah Uang di Kotak
                        </label>
                        <div className="relative">
                            <input
                                id="amount"
                                type="text"
                                inputMode="numeric"
                                value={
                                    formattedAmount ||
                                    (data.amount === 0
                                        ? ""
                                        : formatRupiah(data.amount))
                                }
                                onChange={handleAmountChange}
                                className="w-full text-center text-4xl font-bold text-slate-800 border-none bg-transparent focus:ring-0 placeholder-gray-300 p-0"
                                placeholder="Rp 0"
                                autoFocus
                            />
                            {/* Underline */}
                            <div className="h-1 w-24 bg-emerald-500 mx-auto mt-2 rounded-full opacity-20 user-select-none"></div>
                        </div>
                        {errors.amount && (
                            <p className="text-center mt-2 text-sm text-red-500">
                                {errors.amount}
                            </p>
                        )}
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={processing || data.amount <= 0}
                            className="w-full py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center"
                        >
                            {processing ? "Menyimpan..." : "Simpan Data"}
                            {!processing && (
                                <ArrowRight className="w-5 h-5 ml-2" />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="p-6 text-center">
                <p className="text-xs text-slate-400">
                    Pastikan jumlah uang sesuai dengan fisik.
                </p>
            </div>
        </div>
    );
}

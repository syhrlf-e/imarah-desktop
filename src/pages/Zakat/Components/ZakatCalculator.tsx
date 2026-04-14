import React, { useState } from "react";
import { Calculator } from "lucide-react";
import api from "@/lib/api";
import { formatRupiah } from "@/utils/formatter";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import RupiahInput from "@/components/RupiahInput";

export default function ZakatCalculator() {
    const [zakatType, setZakatType] = useState<"maal" | "fitrah">("maal");
    const [amount, setAmount] = useState<number>(0);
    const [jiwa, setJiwa] = useState<number>(1);
    const [nominalPerJiwa, setNominalPerJiwa] = useState<number>(45000);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ amount: number; is_nishab: boolean } | null>(null);
    const [error, setError] = useState("");

    const calculateZakat = async () => {
        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const payload = zakatType === "maal"
                ? { type: "maal", amount }
                : { type: "fitrah", jiwa, nominal_per_jiwa: nominalPerJiwa };

            const res = await api.post("/zakat/kalkulator", payload);
            setResult(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gagal menghitung zakat");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Kalkulator Zakat</h2>
                    <p className="text-sm text-slate-500">Hitung estimasi kewajiban zakat maal dan fitrah</p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Jenis Zakat
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setZakatType("maal")}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    zakatType === "maal"
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Zakat Maal
                            </button>
                            <button
                                type="button"
                                onClick={() => setZakatType("fitrah")}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    zakatType === "fitrah"
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                Zakat Fitrah
                            </button>
                        </div>
                    </div>

                    {zakatType === "maal" ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Total Harta Setahun (Rupiah)
                            </label>
                            <RupiahInput
                                value={amount}
                                onValueChange={setAmount}
                                placeholder="Masukkan total harta..."
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                *Nishab Zakat Maal mengikuti standar harga emas 85 gram saat ini.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Jumlah Jiwa
                                </label>
                                <TextInput
                                    type="number"
                                    min="1"
                                    value={jiwa}
                                    onChange={(e) => setJiwa(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nominal per Jiwa (Beras 2.5 kg / 3.5 liter)
                                </label>
                                <RupiahInput
                                    value={nominalPerJiwa}
                                    onValueChange={setNominalPerJiwa}
                                />
                            </div>
                        </div>
                    )}

                    <PrimaryButton
                        onClick={calculateZakat}
                        disabled={isLoading || (zakatType === "maal" && amount === 0)}
                        className="w-full justify-center py-3!"
                    >
                        {isLoading ? "Menghitung..." : "Hitung Zakat"}
                    </PrimaryButton>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}
                </div>

                <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Hasil Perhitungan</h3>

                    {result ? (
                        <div className="space-y-4">
                            {zakatType === "maal" && !result.is_nishab ? (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
                                    <p className="font-semibold">Belum Mencapai Nishab</p>
                                    <p className="text-sm mt-1">Total harta Anda belum mencapai batas minimum (nishab) untuk diwajibkan mengeluarkan zakat maal.</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-slate-600 mb-1">Kewajiban Zakat yang harus dibayar:</p>
                                    <div className="text-4xl font-bold text-emerald-600">
                                        {formatRupiah(result.amount)}
                                    </div>
                                    {zakatType === "maal" && (
                                        <p className="text-sm text-emerald-700 mt-2 bg-emerald-100/50 p-2 rounded-lg inline-block">
                                            ✓ Harta telah mencapai nishab
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-8">
                            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Masukkan nominal untuk melihat hasil perhitungan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

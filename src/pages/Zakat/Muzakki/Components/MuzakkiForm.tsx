import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { X } from "lucide-react";
import InputLabel from "@/components/InputLabel";
import TextInput from "@/components/TextInput";
import InputError from "@/components/InputError";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import FormActions from "@/components/FormActions";
interface Muzakki {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    muzakki?: Muzakki | null;
}

export default function MuzakkiForm({ isOpen, onClose, muzakki }: Props) {
    const [data, setDataForm] = useState({
        name: "",
        phone: "",
        address: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));
    const reset = () => setDataForm({ name: "", phone: "", address: "" });
    const clearErrors = () => setErrors({});

    useEffect(() => {
        if (muzakki) {
            setDataForm({
                name: muzakki.name,
                phone: muzakki.phone || "",
                address: muzakki.address || "",
            });
        } else {
            reset();
        }
        clearErrors();
    }, [muzakki, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (muzakki) {
                // TODO: PUT API request
            } else {
                // TODO: POST API request
            }
            reset();
            onClose();
        } catch (error) {
            // Error handling
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md" position="bottom">
            <div className="flex items-center justify-between px-6 py-4 pt-6 sm:pt-4 border-b border-slate-100 shrink-0 bg-white z-10">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                    {muzakki ? "Edit Muzakki" : "Daftarkan Muzakki"}
                </h2>
                <button
                    onClick={onClose}
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors -mr-2"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white min-h-0">
                <form
                    id="muzakki-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div>
                        <InputLabel htmlFor="name" value="Nama Lengkap *" />
                        <TextInput
                            id="name"
                            value={data.name}
                            onChange={(e) => {
                                const val = e.target.value.replace(
                                    /[^a-zA-Z\s]/g,
                                    "",
                                );
                                setData("name", val);
                            }}
                            className="mt-1 block w-full"
                            placeholder="Contoh: Abdullah"
                            isFocused={isOpen} // Focus when opened
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="phone"
                            value="Nomor HP (WhatsApp)"
                        />
                        <TextInput
                            id="phone"
                            value={data.phone}
                            onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, ""); // Hanya angka

                                if (val.length > 0) {
                                    if (val.startsWith("62")) {
                                        val = "0" + val.slice(2);
                                    } else if (!val.startsWith("08")) {
                                        if (val.startsWith("0")) {
                                            val = "08" + val.slice(1);
                                        } else if (val.startsWith("8")) {
                                            val = "0" + val;
                                        } else {
                                            val = "08" + val;
                                        }
                                    }
                                }

                                if (val.length > 13) {
                                    val = val.slice(0, 13);
                                }
                                setData("phone", val);
                            }}
                            className="mt-1 block w-full"
                            placeholder="0812..."
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Alamat" />
                        <textarea
                            id="address"
                            className="mt-1 block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-md shadow-sm"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            rows={3}
                            placeholder="Alamat lengkap..."
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>
                </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white pb-safe">
                <div className="flex gap-3">
                    <SecondaryButton
                        onClick={onClose}
                        className="flex-1 justify-center py-2.5 font-medium"
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        form="muzakki-form"
                        className="flex-1 justify-center py-2.5 font-medium"
                        disabled={
                            processing ||
                            (data.phone.length > 0 && data.phone.length < 12) ||
                            data.phone.length > 13
                        }
                    >
                        Simpan Data
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}

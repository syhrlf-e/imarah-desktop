import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { X } from "lucide-react";
import InputLabel from "@/components/InputLabel";
import TextInput from "@/components/TextInput";
import InputError from "@/components/InputError";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import CustomSelect from "@/components/CustomSelect";
import FormActions from "@/components/FormActions";
interface Mustahiq {
    id: string;
    name: string;
    ashnaf: string;
    address: string | null;
    description: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mustahiq?: Mustahiq | null;
}

const ASHNAF_OPTIONS = [
    { value: "fakir", label: "Fakir" },
    { value: "miskin", label: "Miskin" },
    { value: "amil", label: "Amil" },
    { value: "mualaf", label: "Mualaf" },
    { value: "riqab", label: "Riqab" },
    { value: "gharim", label: "Gharim" },
    { value: "fisabilillah", label: "Fisabilillah" },
    { value: "ibnusabil", label: "Ibnu Sabil" },
];

export default function MustahiqForm({ isOpen, onClose, mustahiq }: Props) {
    const [data, setDataForm] = useState({
        name: "",
        ashnaf: "fakir",
        address: "",
        description: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));
    const reset = () => setDataForm({ name: "", ashnaf: "fakir", address: "", description: "" });
    const clearErrors = () => setErrors({});

    useEffect(() => {
        if (mustahiq) {
            setDataForm({
                name: mustahiq.name,
                ashnaf: mustahiq.ashnaf,
                address: mustahiq.address || "",
                description: mustahiq.description || "",
            });
        } else {
            reset();
            setData("ashnaf", "fakir"); // Default
        }
        clearErrors();
    }, [mustahiq, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (mustahiq) {
                // TODO: PUT API request
            } else {
                // TODO: POST API request
            }
            reset();
            onClose();
        } catch (error) {
            
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md" position="bottom">
            <div className="flex items-center justify-between px-6 py-4 pt-6 sm:pt-4 border-b border-slate-100 shrink-0 bg-white z-10">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                    {mustahiq ? "Edit Mustahiq" : "Daftarkan Mustahiq"}
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
                    id="mustahiq-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <div>
                        <InputLabel htmlFor="name" value="Nama Penerima *" />
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
                            placeholder="Nama Lengkap / Yayasan"
                            isFocused={isOpen}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="ashnaf"
                            value="Kategori Ashnaf *"
                        />
                        <div className="mt-1">
                            <CustomSelect
                                value={data.ashnaf}
                                onChange={(val) => setData("ashnaf", val)}
                                options={ASHNAF_OPTIONS}
                            />
                        </div>
                        <InputError message={errors.ashnaf} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="address" value="Alamat *" />
                        <textarea
                            id="address"
                            required
                            className="mt-1 block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-md shadow-sm"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            rows={3}
                            placeholder="Alamat lengkap..."
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="description"
                            value="Keterangan (Opsional)"
                        />
                        <textarea
                            id="description"
                            className="mt-1 block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-md shadow-sm"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows={2}
                            placeholder="Kondisi ekonomi, jumlah tanggungan, dll."
                        />
                        <InputError
                            message={errors.description}
                            className="mt-2"
                        />
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
                        form="mustahiq-form"
                        className="flex-1 justify-center py-2.5 font-medium"
                        disabled={processing}
                    >
                        Simpan Data
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}

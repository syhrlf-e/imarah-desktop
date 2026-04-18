import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import { FormEventHandler, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/Toast";

interface Props {
    currentName: string;
    currentEmail: string;
    className?: string;
}

export default function UpdateProfileInformationForm({
    currentName,
    currentEmail,
    className = '',
}: Props) {
    const { login, token } = useAuth();

    const [data, setDataForm] = useState({ name: currentName, email: currentEmail });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            const updated = await invoke<any>("update_profile", {
                name: data.name,
                email: data.email,
            });

            if (updated && token) {
                login(token, updated);
            }
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
            toast.success("Profil berhasil diperbarui");
        } catch (err: any) {
            console.error("Update profile failed:", err);
            toast.error("Gagal memperbarui profil. Periksa koneksi internet Anda.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold text-slate-800">Informasi Profil</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Perbarui nama dan alamat email akun Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Alamat Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                    <p className={`text-sm text-emerald-600 font-medium transition-opacity duration-300 ${recentlySuccessful ? 'opacity-100' : 'opacity-0'}`}>
                        ✓ Tersimpan
                    </p>
                </div>
            </form>
        </section>
    );
}

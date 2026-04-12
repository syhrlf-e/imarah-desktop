import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import { FormEventHandler, useRef, useState } from 'react';
import api from '@/lib/api';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [data, setDataForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));
    const reset = (...keys: string[]) => {
        if (keys.length === 0) {
            setDataForm({ current_password: '', password: '', password_confirmation: '' });
            return;
        }
        setDataForm(prev => {
            const next = { ...prev };
            keys.forEach(k => { (next as any)[k] = ''; });
            return next;
        });
    };

    const updatePassword: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await api.put('/password', {
                current_password: data.current_password,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            reset();
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (err: any) {
            const errData = err?.response?.data;
            if (errData?.errors) {
                const validationErrors = errData.errors;
                Object.entries(validationErrors).forEach(([k, msgs]) =>
                    setErrors(prev => ({ ...prev, [k]: (msgs as string[])[0] }))
                );
                if (validationErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (validationErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold text-slate-800">Ubah Kata Sandi</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Gunakan kata sandi yang panjang dan acak agar akun Anda tetap aman.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="current_password" value="Kata Sandi Saat Ini" />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Kata Sandi Baru" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Kata Sandi" />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
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

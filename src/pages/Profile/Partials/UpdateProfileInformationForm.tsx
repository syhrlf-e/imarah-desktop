import InputError from '@/components/InputError';
import InputLabel from '@/components/InputLabel';
import PrimaryButton from '@/components/PrimaryButton';
import TextInput from '@/components/TextInput';
import { Link } from 'react-router-dom';
import { FormEventHandler, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = { name: 'Admin', email: 'admin@example.com', email_verified_at: null };

    const [data, setDataForm] = useState({ name: user.name, email: user.email });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // TODO: fetch API /profile/update
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (err) { }
        finally { setProcessing(false); }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-slate-800">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

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
                    <InputLabel htmlFor="email" value="Email" />

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

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-slate-800">
                            Your email address is unverified.
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    // TODO: fetch verification.send
                                }}
                                type="button"
                                className="rounded-md text-sm text-slate-500 underline hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </button>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                        <p className={`text-sm text-slate-500 transition-opacity duration-300 ${recentlySuccessful ? 'opacity-100' : 'opacity-0'}`}>
                            Saved.
                        </p>
                </div>
            </form>
        </section>
    );
}

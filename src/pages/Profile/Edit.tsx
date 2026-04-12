import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit() {
    const { user } = useAuth();

    return (
        <AppLayout title="Profil Saya">
            <div className="max-w-4xl mx-auto space-y-6 py-2">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
                    <p className="text-sm text-slate-500 mt-1">Kelola informasi akun dan keamanan Anda.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    <UpdateProfileInformationForm
                        currentName={user?.name ?? ''}
                        currentEmail={user?.email ?? ''}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AppLayout>
    );
}

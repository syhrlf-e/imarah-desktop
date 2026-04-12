import DangerButton from "@/components/DangerButton";
import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import Modal from "@/components/Modal";
import SecondaryButton from "@/components/SecondaryButton";
import TextInput from "@/components/TextInput";
import { FormEventHandler, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function DeleteUserForm({
  className = "",
}: {
  className?: string;
}) {
  const { logout } = useAuth();
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef<HTMLInputElement>(null);

  const [data, setDataForm] = useState({ password: "" });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setData = (key: string, value: string) =>
    setDataForm((prev) => ({ ...prev, [key]: value }));
  const reset = () => setDataForm({ password: "" });
  const clearErrors = () => setErrors({});

  const deleteUser: FormEventHandler = async (e) => {
    e.preventDefault();
    setProcessing(true);
    clearErrors();
    try {
      await api.delete("/profile", { data: { password: data.password } });
      logout();
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.errors?.password) {
        setErrors({ password: errData.errors.password[0] });
      } else {
        setErrors({ password: errData?.message ?? "Gagal menghapus akun." });
      }
      passwordInput.current?.focus();
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);
    clearErrors();
    reset();
  };

  return (
    <section className={`space-y-6 ${className}`}>
      <header>
        <h2 className="text-lg font-semibold text-slate-800">Hapus Akun</h2>
        <p className="mt-1 text-sm text-slate-500">
          Setelah akun dihapus, semua data akan ikut terhapus secara permanen.
          Pastikan Anda sudah mengunduh data yang diperlukan sebelum
          melanjutkan.
        </p>
      </header>

      <DangerButton onClick={() => setConfirmingUserDeletion(true)}>
        Hapus Akun
      </DangerButton>

      <Modal
        show={confirmingUserDeletion}
        onClose={closeModal}
        position="bottom"
      >
        <div className="flex items-center justify-between px-6 py-4 pt-6 sm:pt-4 border-b border-slate-100 shrink-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Hapus Akun
          </h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white min-h-0">
          <form id="delete-user-form" onSubmit={deleteUser}>
            <h2 className="text-lg font-medium text-slate-800">
              Apakah Anda yakin ingin menghapus akun?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tindakan ini tidak bisa dibatalkan. Masukkan kata sandi untuk
              mengkonfirmasi penghapusan akun secara permanen.
            </p>

            <div className="mt-6">
              <InputLabel
                htmlFor="password"
                value="Kata Sandi"
                className="sr-only"
              />
              <TextInput
                id="password"
                type="password"
                name="password"
                ref={passwordInput}
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="mt-1 block w-full"
                isFocused
                placeholder="Kata sandi Anda"
              />
              <InputError message={errors.password} className="mt-2" />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white pb-safe">
          <div className="flex gap-3">
            <SecondaryButton
              onClick={closeModal}
              className="flex-1 justify-center py-2.5 font-medium"
            >
              Batal
            </SecondaryButton>
            <DangerButton
              form="delete-user-form"
              className="flex-1 justify-center py-2.5 font-medium"
              disabled={processing}
            >
              Hapus Akun
            </DangerButton>
          </div>
        </div>
      </Modal>
    </section>
  );
}

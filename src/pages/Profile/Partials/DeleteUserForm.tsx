import DangerButton from "@/components/DangerButton";
import InputError from "@/components/InputError";
import InputLabel from "@/components/InputLabel";
import Modal from "@/components/Modal";
import SecondaryButton from "@/components/SecondaryButton";
import TextInput from "@/components/TextInput";
import { FormEventHandler, useRef, useState } from "react";

export default function DeleteUserForm({
    className = "",
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const [data, setDataForm] = useState({ password: "" });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setData = (key: string, value: string) => setDataForm(prev => ({ ...prev, [key]: value }));
    const reset = () => setDataForm({ password: "" });
    const clearErrors = () => setErrors({});

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // TODO: DELETE config and route
            // await fetch("/api/profile", { method: "DELETE", body: JSON.stringify(data) })
            closeModal();
            reset();
        } catch (error) {
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
                <h2 className="text-lg font-medium text-slate-800">
                    Delete Account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <Modal
                show={confirmingUserDeletion}
                onClose={closeModal}
                position="bottom"
            >
                <div className="flex items-center justify-between px-6 py-4 pt-6 sm:pt-4 border-b border-slate-100 shrink-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                        Delete Account
                    </h2>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white min-h-0">
                    <form id="delete-user-form" onSubmit={deleteUser}>
                        <h2 className="text-lg font-medium text-slate-800">
                            Are you sure you want to delete your account?
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Once your account is deleted, all of its resources
                            and data will be permanently deleted. Please enter
                            your password to confirm you would like to
                            permanently delete your account.
                        </p>

                        <div className="mt-6">
                            <InputLabel
                                htmlFor="password"
                                value="Password"
                                className="sr-only"
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="mt-1 block w-full"
                                isFocused
                                placeholder="Password"
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white pb-safe">
                    <div className="flex gap-3">
                        <SecondaryButton
                            onClick={closeModal}
                            className="flex-1 justify-center py-2.5 font-medium"
                        >
                            Cancel
                        </SecondaryButton>

                        <DangerButton
                            form="delete-user-form"
                            className="flex-1 justify-center py-2.5 font-medium"
                            disabled={processing}
                        >
                            Delete Account
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </section>
    );
}

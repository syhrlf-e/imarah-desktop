import { useState } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopHeaderProps {
    auth: any;
    title?: string;
    toggleSidebar: () => void;
}

export default function TopHeader({
    auth,
    title,
    toggleSidebar,
}: TopHeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { logout } = useAuth();

    return (
        <header className="block flex-none z-30 bg-white border-none relative shadow-sm mt-4 mx-4 rounded-2xl">
            <div className="flex items-center justify-between h-[70px] px-4 sm:px-6 lg:px-8">
                <div className="flex items-center">
                    {title && (
                        <h1 className="text-lg font-semibold text-slate-900 tracking-tight block">
                            {title}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors relative">
                        <Bell size={20} />
                    </button>

                    <div className="h-8 w-px bg-slate-200 block"></div>

                    <div className="relative">
                        {/* Invisible overlay to close dropdown on outside click */}
                        {isProfileOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsProfileOpen(false)}
                            ></div>
                        )}

                        <div
                            className="relative z-50 flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-colors -mr-2"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="block text-right">
                                <p className="text-sm font-medium text-slate-800 leading-tight">
                                    {auth.user.name}
                                </p>
                                <p className="text-[10px] text-slate-500 capitalize">
                                    {auth.user.role.replace("_", " ")}
                                </p>
                            </div>
                            <div className="w-9 h-9 flex justify-center items-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                {auth.user.name.charAt(0)}
                            </div>
                        </div>

                        {/* Dropdown Menu Logout */}
                        <div
                            className={`absolute right-0 top-[110%] w-48 bg-white rounded-2xl shadow-lg border border-slate-100 transition-all duration-200 z-50 ${
                                isProfileOpen
                                    ? "opacity-100 visible translate-y-0"
                                    : "opacity-0 invisible -translate-y-2"
                            }`}
                        >
                            <div className="p-2">
                                <button onClick={logout} className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-left">
                                    <LogOut size={16} className="mr-3" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

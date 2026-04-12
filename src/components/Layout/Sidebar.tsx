import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Wallet,
    Box,
    Archive,
    Calendar,
    FileText,
    Settings,
    UserCircle,
    ChevronRight,
    ShieldCheck,
} from "lucide-react";

interface SidebarProps {
    auth: any;
    url: string;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({
    auth,
    url,
    isSidebarOpen,
    toggleSidebar,
}: SidebarProps) {
    const isActive = (route: string) => url.startsWith(route);
    const [isZakatOpen, setIsZakatOpen] = useState(url.startsWith("/zakat"));
    const [isTromolOpen, setIsTromolOpen] = useState(url.startsWith("/tromol"));

    // Sync state with URL changes if needed
    useEffect(() => {
        if (url.startsWith("/zakat") && !isZakatOpen) setIsZakatOpen(true);
        if (url.startsWith("/tromol") && !isTromolOpen) setIsTromolOpen(true);
    }, [url]);

    return (
        <aside className="flex flex-col z-10 w-72 bg-white my-4 ml-4 rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden shrink-0">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight font-poppins">
                            Imarah
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Sistem manajemen masjid
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 flex flex-col overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                <Link
                    to="/dashboard"
                    className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive("/dashboard")
                            ? "text-emerald-700 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                    {isActive("/dashboard") && (
                        <motion.div
                            layoutId="sidebarActiveMenu"
                            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                            }}
                        />
                    )}
                    <LayoutDashboard
                        className={`w-5 h-5 mr-3 transition-colors ${isActive("/dashboard") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                    />
                    Dashboard
                </Link>

                {/* Kas Masjid (Admin & Bendahara) */}
                {["super_admin", "bendahara"].includes(auth.user.role) && (
                    <Link
                        to="/kas"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive("/kas")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/kas") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <Wallet
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/kas") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Kas Masjid
                    </Link>
                )}

                {/* Inventaris (Admin & Sekretaris) */}
                {["super_admin", "sekretaris"].includes(auth.user.role) && (
                    <Link
                        to="/inventaris"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive("/inventaris")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/inventaris") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <Archive
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/inventaris") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Inventaris
                    </Link>
                )}

                {/* Agenda (Super Admin) */}
                {["super_admin"].includes(auth.user.role) && (
                    <Link
                        to="/agenda"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive("/agenda")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/agenda") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <Calendar
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/agenda") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Agenda
                    </Link>
                )}

                {/* Laporan (Super Admin & Bendahara) */}
                {["super_admin", "bendahara"].includes(auth.user.role) && (
                    <Link
                        to="/laporan"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive("/laporan")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/laporan") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <FileText
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/laporan") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Laporan
                    </Link>
                )}

                {["super_admin", "bendahara", "petugas_zakat"].includes(
                    auth.user.role,
                ) && (
                    <>
                        {auth.user.role === "petugas_zakat" ? (
                            <>
                                {/* Urutan datar khusus Petugas Zakat */}
                                <Link
                                    to="/zakat/muzakki"
                                    className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive("/zakat/muzakki") ? "text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                >
                                    {isActive("/zakat/muzakki") && (
                                        <motion.div
                                            layoutId="sidebarActiveMenu"
                                            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <UserCircle
                                        className={`w-5 h-5 mr-3 transition-colors ${isActive("/zakat/muzakki") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                    />
                                    Data Muzakki
                                </Link>
                                <Link
                                    to="/zakat/mustahiq"
                                    className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive("/zakat/mustahiq") ? "text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                >
                                    {isActive("/zakat/mustahiq") && (
                                        <motion.div
                                            layoutId="sidebarActiveMenu"
                                            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <UserCircle
                                        className={`w-5 h-5 mr-3 transition-colors ${isActive("/zakat/mustahiq") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                    />
                                    Data Mustahiq
                                </Link>
                                <Link
                                    to="/zakat/penerimaan"
                                    className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive("/zakat/penerimaan") ? "text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                >
                                    {isActive("/zakat/penerimaan") && (
                                        <motion.div
                                            layoutId="sidebarActiveMenu"
                                            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <UserCircle
                                        className={`w-5 h-5 mr-3 transition-colors ${isActive("/zakat/penerimaan") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                    />
                                    Penerimaan
                                </Link>
                                <Link
                                    to="/zakat/penyaluran"
                                    className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive("/zakat/penyaluran") ? "text-emerald-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                >
                                    {isActive("/zakat/penyaluran") && (
                                        <motion.div
                                            layoutId="sidebarActiveMenu"
                                            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <UserCircle
                                        className={`w-5 h-5 mr-3 transition-colors ${isActive("/zakat/penyaluran") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                    />
                                    Penyaluran
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* Zakat Collapsible (Admin & Bendahara) */}
                                <div>
                                    <button
                                        onClick={() =>
                                            setIsZakatOpen(!isZakatOpen)
                                        }
                                        className={`group relative z-10 w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                            isActive("/zakat") && !isZakatOpen
                                                ? "text-emerald-700 font-semibold"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        {isActive("/zakat") && !isZakatOpen && (
                                            <motion.div
                                                layoutId="sidebarActiveMenu"
                                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                        <div className="flex items-center">
                                            <UserCircle
                                                className={`w-5 h-5 mr-3 transition-colors ${isActive("/zakat") && !isZakatOpen ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                            />
                                            Zakat
                                        </div>
                                        <ChevronRight
                                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isZakatOpen ? "rotate-90" : ""}`}
                                        />
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isZakatOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
                                    >
                                        <div className="pl-11 pr-3 py-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-200">
                                            <Link
                                                to="/zakat/muzakki"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${isActive("/zakat/muzakki") ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {isActive("/zakat/muzakki") && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Muzakki
                                            </Link>
                                            <Link
                                                to="/zakat/mustahiq"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${isActive("/zakat/mustahiq") ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {isActive(
                                                    "/zakat/mustahiq",
                                                ) && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Mustahiq
                                            </Link>
                                            <Link
                                                to="/zakat/penerimaan"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${isActive("/zakat/penerimaan") ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {isActive(
                                                    "/zakat/penerimaan",
                                                ) && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Penerimaan
                                            </Link>
                                            <Link
                                                to="/zakat/penyaluran"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${isActive("/zakat/penyaluran") ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {isActive(
                                                    "/zakat/penyaluran",
                                                ) && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Penyaluran
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Tromol Collapsible (Admin & Bendahara only) */}
                                <div>
                                    <button
                                        onClick={() =>
                                            setIsTromolOpen(!isTromolOpen)
                                        }
                                        className={`group relative z-10 w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                            isActive("/tromol") && !isTromolOpen
                                                ? "text-emerald-700 font-semibold"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        {isActive("/tromol") &&
                                            !isTromolOpen && (
                                                <motion.div
                                                    layoutId="sidebarActiveMenu"
                                                    className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 400,
                                                        damping: 30,
                                                    }}
                                                />
                                            )}
                                        <div className="flex items-center">
                                            <Box
                                                className={`w-5 h-5 mr-3 transition-colors ${isActive("/tromol") && !isTromolOpen ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                                            />
                                            Tromol
                                        </div>
                                        <ChevronRight
                                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTromolOpen ? "rotate-90" : ""}`}
                                        />
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isTromolOpen ? "max-h-32 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
                                    >
                                        <div className="pl-11 pr-3 py-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-200">
                                            <Link
                                                to="/tromol"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${url === "/tromol" ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {url === "/tromol" && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Daftar Kotak
                                            </Link>
                                            <Link
                                                to="/tromol/history"
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${isActive("/tromol/history") ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                                            >
                                                {isActive(
                                                    "/tromol/history",
                                                ) && (
                                                    <motion.div
                                                        layoutId="sidebarActiveMenu"
                                                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 400,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                                Riwayat
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* Manajemen Pengguna & Pengaturan HANYA Super Admin (Mentok Bawah) */}
            {auth.user.role === "super_admin" && (
                <div className="mt-auto p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm shrink-0">
                    <Link
                        to="/users"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 mb-1 ${
                            isActive("/users")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/users") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <ShieldCheck
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/users") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Manajemen Pengguna
                    </Link>
                    <Link
                        to="/settings"
                        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive("/settings")
                                ? "text-emerald-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {isActive("/settings") && (
                            <motion.div
                                layoutId="sidebarActiveMenu"
                                className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                            />
                        )}
                        <Settings
                            className={`w-5 h-5 mr-3 transition-colors ${isActive("/settings") ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                        />
                        Pengaturan
                    </Link>
                </div>
            )}
        </aside>
    );
}

import { Link } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import {
    Users,
    Wallet,
    Calculator,
    ArrowRight,
    UserCheck,
    ArrowDownToLine,
    ArrowUpFromLine,
} from "lucide-react";


const menus = [
    {
        title: "Manajemen Muzakki",
        description: "Kelola data donatur zakat, infaq, dan shodaqoh.",
        icon: Users,
        href: "/zakat/muzakki",
        color: "bg-blue-500",
    },
    {
        title: "Manajemen Mustahiq",
        description: "Kelola data penerima zakat (8 Ashnaf).",
        icon: Users,
        href: "/zakat/mustahiq",
        color: "bg-purple-500",
    },
    {
        title: "Penerimaan Zakat",
        description: "Catat dan kelola penerimaan zakat maal & fitrah.",
        icon: Wallet,
        href: "/zakat/penerimaan",
        color: "bg-emerald-500",
    },
    {
        title: "Penyaluran",
        description: "Kelola distribusi dan penyaluran dana zakat.",
        icon: Wallet,
        href: "/zakat/penyaluran",
        color: "bg-amber-500",
    },
];

export default function Index() {
    return (
        <AppLayout title="Zakat">
            {/* ── Bagian 1: Judul & deskripsi — hanya tampil di desktop ── */}
            <div className="block mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Modul Zakat
                </h1>
                <p className="mt-1 text-sm text-slate-700">
                    Pusat pengelolaan zakat, infaq, dan shodaqoh.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map((menu, index) => (
                    <Link
                        key={index}
                        to={menu.href}
                        className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 border border-slate-100 overflow-hidden group"
                    >
                        <div className="p-6">
                            <div
                                className={`w-12 h-12 ${menu.color} rounded-lg flex items-center justify-center mb-4 text-white shadow-sm`}
                            >
                                <menu.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                {menu.title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {menu.description}
                            </p>
                            <div className="mt-4 flex items-center text-sm font-medium text-emerald-600">
                                Buka Menu{" "}
                                <ArrowRight className="ml-1 w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}

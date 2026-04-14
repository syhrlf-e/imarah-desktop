import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

type Role = "super_admin" | "bendahara" | "sekretaris" | "petugas_zakat" | string;

interface SubMenu {
  title: string;
  href: string;
  roles: Role[];
}

interface Menu {
  title: string;
  href?: string;
  icon: any;
  roles: Role[];
  subMenus?: SubMenu[];
}

const MENUS: Menu[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["all"],
  },
  {
    title: "Kas Masjid",
    href: "/kas",
    icon: Wallet,
    roles: ["super_admin", "bendahara"],
  },
  {
    title: "Inventaris",
    href: "/inventaris",
    icon: Archive,
    roles: ["super_admin", "sekretaris"],
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
    roles: ["super_admin", "bendahara", "petugas_zakat"],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: FileText,
    roles: ["super_admin", "bendahara"],
  },
  {
    title: "Zakat",
    icon: UserCircle,
    roles: ["super_admin", "bendahara", "petugas_zakat"],
    subMenus: [
      { title: "Kalkulator", href: "/zakat/kalkulator", roles: ["super_admin", "bendahara", "petugas_zakat"] },
      { title: "Muzakki", href: "/zakat/muzakki", roles: ["super_admin", "bendahara", "petugas_zakat"] },
      { title: "Mustahiq", href: "/zakat/mustahiq", roles: ["super_admin", "bendahara", "petugas_zakat"] },
      { title: "Penerimaan", href: "/zakat/penerimaan", roles: ["super_admin", "bendahara", "petugas_zakat"] },
      { title: "Penyaluran", href: "/zakat/penyaluran", roles: ["super_admin", "bendahara", "petugas_zakat"] },
    ],
  },
  {
    title: "Tromol",
    href: "/tromol",
    icon: Box,
    roles: ["super_admin", "bendahara"],
    subMenus: [
      { title: "Daftar Kotak", href: "/tromol", roles: ["super_admin", "bendahara"] },
      { title: "Riwayat", href: "/tromol/history", roles: ["super_admin", "bendahara"] },
    ],
  },
];

const SETTINGS_MENUS: Menu[] = [
  {
    title: "Manajemen Pengguna",
    href: "/user-management",
    icon: ShieldCheck,
    roles: ["super_admin"],
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];

export default function Sidebar({ auth, url }: SidebarProps) {
  const userRole = auth.user.role;
  const isActive = (route: string) => url.startsWith(route);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("imarah_sidebar_menus");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Zakat: url.startsWith("/zakat"),
      Tromol: url.startsWith("/tromol"),
    };
  });

  useEffect(() => {
    localStorage.setItem("imarah_sidebar_menus", JSON.stringify(openMenus));
  }, [openMenus]);

  useEffect(() => {
    if (url.startsWith("/zakat") && !openMenus["Zakat"]) {
      setOpenMenus((p) => ({ ...p, Zakat: true }));
    }
    if (url.startsWith("/tromol") && !openMenus["Tromol"]) {
      setOpenMenus((p) => ({ ...p, Tromol: true }));
    }
  }, [url]);

  const toggleSubMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const hasRole = (roles: Role[]) => {
    if (roles.includes("all")) return true;
    return roles.includes(userRole);
  };

  // Komponen Helper Render Link
  const renderLink = (item: Menu | SubMenu, isSubMenu = false) => {
    if (!item.href) return null;
    const active = isActive(item.href);

    if (isSubMenu) {
      return (
        <Link
          key={item.href}
          to={item.href}
          className={`block px-3 py-2 text-sm rounded-lg transition-colors relative z-10 ${
            url === item.href || (item.href !== "/tromol" && active) 
              ? "text-emerald-700 font-semibold"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          {(url === item.href || (item.href !== "/tromol" && active)) && (
            <motion.div
              layoutId={`sidebarActiveMenu${isSubMenu ? "Sub" : ""}`}
              className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {item.title}
        </Link>
      );
    }

    const itemAsMenu = item as Menu;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={`group relative z-10 flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          active
            ? "text-emerald-700 font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        {active && (
          <motion.div
            layoutId="sidebarActiveMenu"
            className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <itemAsMenu.icon
          className={`w-5 h-5 mr-3 transition-colors ${
            active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
          }`}
        />
        {item.title}
      </Link>
    );
  };

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

      {/* Main Menus */}
      <nav className="flex-1 flex flex-col overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {MENUS.map((menu) => {
          if (!hasRole(menu.roles)) return null;

          if (menu.subMenus) {
            const isOpen = openMenus[menu.title] || false;
            // Check if any child is active
            const isChildActive = menu.subMenus.some((sub) => {
                if (sub.href === "/tromol") return url === "/tromol";
                return isActive(sub.href);
            });

            return (
              <div key={menu.title}>
                <div
                  onClick={() => toggleSubMenu(menu.title)}
                  className={`cursor-pointer group relative z-10 w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isChildActive && !isOpen
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {isChildActive && !isOpen && (
                    <motion.div
                      layoutId="sidebarActiveMenu"
                      className="absolute inset-0 bg-emerald-50 rounded-xl shadow-sm shadow-emerald-100/50 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {menu.href ? (
                    <Link to={menu.href} className="flex items-center flex-1">
                      <menu.icon
                        className={`w-5 h-5 mr-3 transition-colors ${
                          isChildActive && !isOpen
                            ? "text-emerald-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      {menu.title}
                    </Link>
                  ) : (
                    <div className="flex items-center flex-1">
                      <menu.icon
                        className={`w-5 h-5 mr-3 transition-colors ${
                          isChildActive && !isOpen
                            ? "text-emerald-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      {menu.title}
                    </div>
                  )}
                  
                  <div className="p-1 -mr-1 rounded-md transition-colors">
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-60 opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-11 pr-3 py-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-200">
                    {menu.subMenus.map((sub) => {
                      if (!hasRole(sub.roles)) return null;
                      return renderLink(sub, true);
                    })}
                  </div>
                </div>
              </div>
            );
          }

          return renderLink(menu);
        })}
      </nav>

      {/* Settings Menus (Bottom) */}
      {SETTINGS_MENUS.some((menu) => hasRole(menu.roles)) && (
        <div className="mt-auto p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm shrink-0">
          {SETTINGS_MENUS.map((menu) => {
            if (!hasRole(menu.roles)) return null;
            return renderLink(menu);
          })}
        </div>
      )}
    </aside>
  );
}

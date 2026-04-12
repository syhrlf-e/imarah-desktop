import ApplicationLogo from "@/components/ApplicationLogo";
import { Link } from "react-router-dom";
import { PropsWithChildren } from "react";
import { useNetwork } from "@/hooks/useNetwork";
import { WifiOff } from "lucide-react";
import imgLogin from "@/assets/img_login.png";

export default function Guest({ children }: PropsWithChildren) {
    const isOnline = useNetwork();
    return (
        <div className="flex flex-col min-h-screen font-sans">
            {!isOnline && (
                <div className="bg-red-500 text-white px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center space-x-2 shadow-sm relative z-50 w-full shrink-0">
                    <WifiOff size={16} />
                    <span>Koneksi Terputus. Akses sistem dibatasi.</span>
                </div>
            )}
            <div className="flex flex-1 bg-slate-50">
                {/* Left Area - Image (Fixed 60% di Layar Besar) */}
                <div className="relative hidden lg:block lg:w-[60%] bg-black">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${imgLogin})` }}
                    ></div>

                    {/* Base Overlay to slightly darken everything */}
                    <div className="absolute inset-0 bg-black/20"></div>

                    {/* Fading Blur Effect (Bottom 60% of image) */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 backdrop-blur-sm [mask-image:linear-gradient(to_top,black_5%,transparent_80%)] [-webkit-mask-image:linear-gradient(to_top,black_5%,transparent_80%)]"></div>

                    {/* Dark Gradient Overlay for text readability (Bottom 75% of image) */}
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent"></div>

                    <div className="relative z-10 flex h-full flex-col justify-end px-16 pb-16 text-white text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-md font-poppins">
                                Selamat Datang 👋
                            </h1>
                        </div>
                        <p className="text-lg font-light text-emerald-50/80 max-w-lg leading-relaxed">
                            Platform modern untuk mengelola keuangan,
                            inventaris, zakat, dan agenda kegiatan masjid secara
                            profesional, transparan, dan terpercaya.
                        </p>
                    </div>
                </div>

                {/* Right Area - Form Auth (Fixed 40% di Layar Besar) */}
                <div className="flex flex-1 lg:w-[40%] lg:flex-none flex-col justify-center px-5 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white shadow-2xl relative z-20">
                    <div className="mx-auto w-full w-96">
                        <div className="mb-12 flex justify-center text-center">
                            <Link
                                to="/"
                                className="flex flex-col items-center"
                            >
                                {/* No Logo or Text */}
                            </Link>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

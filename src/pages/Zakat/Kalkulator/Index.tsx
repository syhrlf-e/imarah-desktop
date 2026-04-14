import AppLayout from "@/layouts/AppLayout";
import PageHeader from "@/components/PageHeader";
import { useDate } from "@/hooks/useDate";
import ZakatCalculator from "../Components/ZakatCalculator";

export default function KalkulatorIndex() {
    const { masehiDateStr, hijriDate } = useDate();

    return (
        <AppLayout title="Kalkulator Zakat">
            <div className="contents">
                <PageHeader
                    title="Kalkulator Zakat"
                    description="Hitung estimasi kewajiban zakat maal dan fitrah dengan mudah."
                >
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{masehiDateStr}</p>
                        <p className="text-xs text-slate-500 mt-1">{hijriDate}</p>
                    </div>
                </PageHeader>
                
                <div className="px-6 pb-6">
                    <ZakatCalculator />
                </div>
            </div>
        </AppLayout>
    );
}

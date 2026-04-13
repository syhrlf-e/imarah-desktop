import { Clock, MapPin, CalendarDays, AlignLeft } from "lucide-react";
import dayjs from "dayjs";
import WidgetContainer from "@/components/UI/WidgetContainer";
import SectionHeader from "@/components/UI/SectionHeader";
import EmptyState from "@/components/UI/EmptyState";
import { useAgendaData } from "@/hooks/api/useAgenda";

interface Agenda {
  id: number;
  title: string;
  type: string;
  start_time: string;
  location: string;
  description?: string;
}

export default function UpcomingAgendas() {
  // Ambil data langsung dari endpoint agenda agar mendapatkan field deskripsi secara utuh
  const { data: agendaRes, isLoading: loading } = useAgendaData("");
  const agendas: Agenda[] = agendaRes?.items || agendaRes || [];

  // Logika Filter H-3: Hanya tampilkan agenda dari mulai hari ini sampai 3 hari ke depan
  // Dan dibatasi hanya 1 data saja agar ukurannya serasi dengan card stats
  const filteredAgendas = agendas
    .filter((agenda) => {
      const start = dayjs(agenda.start_time);
      const now = dayjs().startOf("day");
      const threeDaysLater = dayjs().add(3, "day").endOf("day");
      return start.isAfter(now) && start.isBefore(threeDaysLater);
    })
    .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf())
    .slice(0, 1);

  return (
    <WidgetContainer className="order-1 shrink-0 flex flex-col">
      <SectionHeader
        title="Agenda Mendatang"
        actionLabel="Semua"
        actionHref="/agenda"
      />
      <div className="p-2 flex flex-col pt-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4 space-y-4">
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
          </div>
        ) : filteredAgendas.length > 0 ? (
          <div className="space-y-1">
            {filteredAgendas.map((agenda) => (
              <div
                key={agenda.id}
                className="flex gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors items-start border border-transparent hover:border-slate-100"
              >
                {/* KIRI: Kotak Tanggal & Bulan */}
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 shrink-0 text-emerald-700">
                  <span className="text-[10px] font-semibold uppercase leading-none mb-1">
                    {dayjs(agenda.start_time).format("MMM")}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {dayjs(agenda.start_time).format("DD")}
                  </span>
                </div>

                {/* TENGAH & KANAN: Konten Agenda */}
                <div className="flex flex-1 min-w-0 justify-between items-start gap-4">
                  {/* TENGAH: Nama & Deskripsi */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                      {agenda.title}
                    </h4>
                    {agenda.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate flex items-center">
                        <AlignLeft className="w-3 h-3 mr-1.5 shrink-0 opacity-50" />
                        <span className="truncate">{agenda.description}</span>
                      </p>
                    )}
                    {!agenda.description && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        Tidak ada deskripsi
                      </p>
                    )}
                  </div>

                  {/* KANAN: Waktu & Lokasi */}
                  <div className="flex flex-col items-end shrink-0 gap-1 mt-0.5">
                    <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {dayjs(agenda.start_time).format("HH:mm")}
                    </span>
                    <span className="flex items-center justify-end text-[11px] text-slate-500 max-w-[100px] truncate text-right">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{agenda.location || "-"}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="Tidak ada agenda H-3" />
        )}
      </div>
    </WidgetContainer>
  );
}

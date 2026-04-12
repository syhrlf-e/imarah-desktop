import { Clock, MapPin, CalendarDays } from "lucide-react";
import dayjs from "dayjs";
import WidgetContainer from "@/components/UI/WidgetContainer";
import SectionHeader from "@/components/UI/SectionHeader";
import EmptyState from "@/components/UI/EmptyState";

interface Agenda {
  id: number;
  title: string;
  type: string;
  start_time: string;
  location: string;
}

interface UpcomingAgendasProps {
  agendas: Agenda[];
  loading?: boolean;
}

export default function UpcomingAgendas({
  agendas,
  loading,
}: UpcomingAgendasProps) {
  return (
    <WidgetContainer className="order-1 shrink-0">
      <SectionHeader
        title="Agenda Mendatang"
        actionLabel="Semua"
        actionHref="/agenda"
      />
      <div className="p-2 flex flex-col pt-3">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        ) : agendas.length > 0 ? (
          <div className="space-y-1">
            {agendas.map((agenda) => (
              <div
                key={agenda.id}
                className="flex gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors items-start"
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 shrink-0 text-emerald-700">
                  <span className="text-[10px] font-semibold uppercase leading-none mb-1">
                    {dayjs(agenda.start_time).format("MMM")}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {dayjs(agenda.start_time).format("DD")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {agenda.title}
                  </h4>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="flex items-center text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {dayjs(agenda.start_time).format("HH:mm")} WIB
                    </span>
                    <span className="flex items-center text-xs text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span className="truncate">{agenda.location}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="Tidak ada agenda dekat" />
        )}
      </div>
    </WidgetContainer>
  );
}

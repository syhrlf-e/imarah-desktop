import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import dayjs from "dayjs";
import { formatRupiah } from "@/utils/formatter";
import WidgetContainer from "@/components/UI/WidgetContainer";
import SectionHeader from "@/components/UI/SectionHeader";
import EmptyState from "@/components/UI/EmptyState";

interface Transaction {
  id: number;
  category: string;
  type: "pemasukan" | "pengeluaran";
  amount: number;
  transaction_date: string;
  description: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  totalCount: number;
  loading?: boolean;
}

export default function RecentTransactions({
  transactions,
  totalCount,
  loading,
}: RecentTransactionsProps) {
  return (
    <WidgetContainer className="order-2 flex-1">
      <SectionHeader
        title="Transaksi Terbaru"
        actionLabel="Semua"
        actionHref="/kas"
      />
      <div className="p-2 flex-1 flex flex-col min-h-0 custom-scrollbar">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 4).map((trx) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100"
              >
                <div className="flex gap-3 items-center min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-xs truncate flex items-center">
                      {trx.category.replace(/_/g, " ").toUpperCase()}
                      {trx.type === "pemasukan" ? (
                        <TrendingUp className="w-3.5 h-3.5 inline-block ml-1.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 inline-block ml-1.5 text-red-500" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {dayjs(trx.transaction_date).format("DD MMM YYYY")}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p
                    className={`font-semibold text-xs font-mono tracking-tight ${
                      trx.type === "pemasukan"
                        ? "text-emerald-600"
                        : "text-slate-800"
                    }`}
                  >
                    {trx.type === "pemasukan" ? "+" : "-"}
                    {formatRupiah(trx.amount)}
                  </p>
                </div>
              </div>
            ))}
            {totalCount > 4 && (
              <div className="text-center py-2 mt-auto border-t border-slate-100 shrink-0">
                <p className="text-[11px] text-slate-500 font-medium">
                  ... dan {totalCount - 4} transaksi lainnya
                </p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={Wallet} title="Belum ada transaksi" />
        )}
      </div>
    </WidgetContainer>
  );
}

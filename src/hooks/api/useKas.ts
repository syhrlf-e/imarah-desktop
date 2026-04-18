import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/Toast";

export const useKasSummary = (month: string | number, year: string | number) => {
  return useQuery({
    queryKey: ["kas", "summary", month, year],
    queryFn: () => invoke<any>("get_kas_summary", { month: String(month), year: String(year) }),
    staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
  });
};

export const useKasTransactions = (params: string) => {
  return useQuery({
    queryKey: ["kas", "transactions", params],
    queryFn: () => invoke<any>("list_kas_transactions", { params }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
  });
};

export const useKasMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["kas"], type: "active" });
    await queryClient.removeQueries({ queryKey: ["kas"], type: "inactive" });
    await queryClient.removeQueries({ queryKey: ["dashboard"] });
  };

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_kas_transaction", { data }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan transaksi"),
  });

  const verify = useMutation({
    mutationFn: (id: string) => invoke("verify_kas_transaction", { id }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil diverifikasi");
    },
    onError: () => toast.error("Gagal memverifikasi transaksi"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_kas_transaction", { id }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus transaksi"),
  });

  return { store, verify, remove };
};

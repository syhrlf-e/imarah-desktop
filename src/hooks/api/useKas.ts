import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { kasService } from "@/services/kasService";
import { toast } from "sonner";

export const useKasSummary = (month: string | number, year: string | number) => {
  return useQuery({
    queryKey: ["kas", "summary", month, year],
    queryFn: () => kasService.getSummary(month, year),
    staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
  });
};

export const useKasTransactions = (params: string) => {
  return useQuery({
    queryKey: ["kas", "transactions", params],
    queryFn: () => kasService.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
  });
};

export const useKasMutation = () => {
  const queryClient = useQueryClient();

  // Fungsi helper untuk refresh data setelah mutasi berhasil
  const invalidate = async () => {
    // Invalidate active queries to refetch them immediately
    await queryClient.invalidateQueries({ queryKey: ["kas"], type: "active" });
    // Remove inactive queries (like other cached filters) so they don't flash old data
    await queryClient.removeQueries({ queryKey: ["kas"], type: "inactive" });
    
    // Hapus cache dashboard agar jika kembali ke dashboard, datanya benar-benar fresh dan tidak berkedip
    await queryClient.removeQueries({ queryKey: ["dashboard"] });
  };

  const store = useMutation({
    mutationFn: kasService.create,
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan transaksi"),
  });

  const verify = useMutation({
    mutationFn: kasService.verify,
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil diverifikasi");
    },
    onError: () => toast.error("Gagal memverifikasi transaksi"),
  });

  const remove = useMutation({
    mutationFn: kasService.delete,
    onSuccess: async () => {
      await invalidate();
      toast.success("Transaksi berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus transaksi"),
  });

  return { store, verify, remove };
};

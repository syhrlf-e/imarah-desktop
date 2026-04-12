import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { kasService } from "@/services/kasService";
import { toast } from "sonner";

export const useKasData = (params: string) => {
  return useQuery({
    queryKey: ["kas", params],
    queryFn: () => kasService.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useKasMutation = () => {
  const queryClient = useQueryClient();

  // Fungsi helper untuk refresh data setelah mutasi berhasil
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["kas"] });
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

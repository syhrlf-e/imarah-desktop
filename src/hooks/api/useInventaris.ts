import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventarisService } from "@/services/inventarisService";
import { toast } from "sonner";

export const useInventarisData = (params: string) => {
  return useQuery({
    queryKey: ["inventaris", params],
    queryFn: () => inventarisService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useInventarisMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["inventaris"] });
  };

  const store = useMutation({
    mutationFn: inventarisService.create,
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan barang inventaris"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventarisService.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui barang inventaris"),
  });

  const remove = useMutation({
    mutationFn: inventarisService.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus barang inventaris"),
  });

  return { store, update, remove };
};

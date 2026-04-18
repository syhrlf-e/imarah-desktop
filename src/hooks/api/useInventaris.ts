import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/Toast";

export const useInventarisData = (params: string) => {
  return useQuery({
    queryKey: ["inventaris", params],
    queryFn: () => invoke<any>("list_inventaris", { params }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInventarisMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["inventaris"] });
  };

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_inventaris", { data }),
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil disimpan");
    },
    onError: () => toast.error("Gagal menyimpan barang inventaris"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
        invoke("update_inventaris", { id, data }),
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui barang inventaris"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_inventaris", { id }),
    onSuccess: () => {
      invalidate();
      toast.success("Barang inventaris berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus barang inventaris"),
  });

  return { store, update, remove };
};

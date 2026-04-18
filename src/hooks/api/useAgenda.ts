import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "@/components/Toast";

export const useAgendaData = (params: string) => {
  return useQuery({
    queryKey: ["agenda", params],
    queryFn: () => invoke<any>("list_agenda", { params }),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAgendaMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_agenda", { data }),
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat agenda"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
        invoke("update_agenda", { id, data }),
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui agenda"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_agenda", { id }),
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus agenda"),
  });

  return { store, update, remove };
};

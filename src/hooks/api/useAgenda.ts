import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agendaService } from "@/services/agendaService";
import { toast } from "sonner";

export const useAgendaData = (params: string) => {
  return useQuery({
    queryKey: ["agenda", params],
    queryFn: () => agendaService.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAgendaMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const store = useMutation({
    mutationFn: agendaService.create,
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat agenda"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => agendaService.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil diperbarui");
    },
    onError: () => toast.error("Gagal memperbarui agenda"),
  });

  const remove = useMutation({
    mutationFn: agendaService.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Agenda berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus agenda"),
  });

  return { store, update, remove };
};

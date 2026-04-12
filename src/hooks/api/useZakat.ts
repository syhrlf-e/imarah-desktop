import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as zakatService from "@/services/zakatService";

// ── Muzakki Hooks ──────────────────────────────────────────
export const useMuzakkiData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_muzakkis", params],
    queryFn: () => zakatService.getMuzakkis(params),
  });
};

export const useMuzakkiMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: zakatService.createMuzakki,
    onSuccess: async () => {
      toast.success("Muzakki berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan Muzakki");
    },
  });

  const remove = useMutation({
    mutationFn: zakatService.deleteMuzakki,
    onSuccess: async () => {
      toast.success("Muzakki berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
    },
    onError: () => toast.error("Gagal menghapus Muzakki"),
  });

  return { create, remove };
};

// ── Mustahiq Hooks ─────────────────────────────────────────
export const useMustahiqData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_mustahiqs", params],
    queryFn: () => zakatService.getMustahiqs(params),
  });
};

export const useMustahiqMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: zakatService.createMustahiq,
    onSuccess: async () => {
      toast.success("Mustahiq berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan Mustahiq");
    },
  });

  const remove = useMutation({
    mutationFn: zakatService.deleteMustahiq,
    onSuccess: async () => {
      toast.success("Mustahiq berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
    },
    onError: () => toast.error("Gagal menghapus Mustahiq"),
  });

  return { create, remove };
};

// ── Penerimaan Hooks ───────────────────────────────────────
export const usePenerimaanData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penerimaans", params],
    queryFn: () => zakatService.getPenerimaan(params),
  });
};

export const usePenerimaanMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: zakatService.createPenerimaan,
    onSuccess: async () => {
      toast.success("Penerimaan Zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat penerimaan");
    },
  });

  const remove = useMutation({
    mutationFn: zakatService.deletePenerimaan,
    onSuccess: async () => {
      toast.success("Catatan penerimaan berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: () => toast.error("Gagal menghapus penerimaan"),
  });

  return { create, remove };
};

// ── Penyaluran Hooks ───────────────────────────────────────
export const usePenyaluranData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penyalurans", params],
    queryFn: () => zakatService.getPenyaluran(params),
  });
};

export const usePenyaluranMutation = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: zakatService.createPenyaluran,
    onSuccess: async () => {
      toast.success("Penyaluran Zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat penyaluran");
    },
  });

  const remove = useMutation({
    mutationFn: zakatService.deletePenyaluran,
    onSuccess: async () => {
      toast.success("Catatan penyaluran berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: () => toast.error("Gagal menghapus penyaluran"),
  });

  return { create, remove };
};

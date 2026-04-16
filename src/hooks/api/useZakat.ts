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

export const useMuzakkiMutation = (id?: string) => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => zakatService.createMuzakki(data),
    onSuccess: async () => {
      toast.success("Muzakki berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan Muzakki");
    },
  });

  const update = useMutation({
    mutationFn: (data: any) => zakatService.updateMuzakki({ ...data, id: id! }),
    onSuccess: async () => {
      toast.success("Data Muzakki berhasil diperbarui!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memperbarui data");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => zakatService.deleteMuzakki(id),
    onSuccess: async () => {
      toast.success("Muzakki berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
    },
    onError: () => toast.error("Gagal menghapus Muzakki"),
  });

  return { store, update, remove };
};

// ── Mustahiq Hooks ──────────────────────────────────────────
export const useMustahiqData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_mustahiqs", params],
    queryFn: () => zakatService.getMustahiqs(params),
  });
};

export const useMustahiqMutation = (id?: string) => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => zakatService.createMustahiq(data),
    onSuccess: async () => {
      toast.success("Mustahiq berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan Mustahiq");
    },
  });

  const update = useMutation({
    mutationFn: (data: any) => zakatService.updateMustahiq({ ...data, id: id! }),
    onSuccess: async () => {
      toast.success("Data Mustahiq berhasil diperbarui!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memperbarui data");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => zakatService.deleteMustahiq(id),
    onSuccess: async () => {
      toast.success("Mustahiq berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
    },
    onError: () => toast.error("Gagal menghapus Mustahiq"),
  });

  return { store, update, remove };
};

// ── Penerimaan Hooks ────────────────────────────────────────
export const usePenerimaanData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penerimaans", params],
    queryFn: () => zakatService.getPenerimaan(params),
  });
};

export const usePenerimaanMutation = () => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => zakatService.createPenerimaan(data),
    onSuccess: async () => {
      toast.success("Penerimaan zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat penerimaan");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => zakatService.deletePenerimaan(id),
    onSuccess: async () => {
      toast.success("Penerimaan zakat berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: () => toast.error("Gagal menghapus penerimaan"),
  });

  return { store, remove };
};

// ── Penyaluran Hooks ────────────────────────────────────────
export const usePenyaluranData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penyalurans", params],
    queryFn: () => zakatService.getPenyaluran(params),
  });
};

export const usePenyaluranMutation = () => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => zakatService.createPenyaluran(data),
    onSuccess: async () => {
      toast.success("Penyaluran zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal mencatat penyaluran");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => zakatService.deletePenyaluran(id),
    onSuccess: async () => {
      toast.success("Penyaluran zakat berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: () => toast.error("Gagal menghapus penyaluran"),
  });

  return { store, remove };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/Toast";
import * as zakatService from "@/services/zakatService";
import { invoke } from "@tauri-apps/api/core";

// ── Muzakki Hooks ──────────────────────────────────────────
export const useMuzakkiData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_muzakkis", params],
    queryFn: () => invoke<any>("list_muzakki", { params: params || "" }),
  });
};

export const useMuzakkiMutation = (id?: string) => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_muzakki", { data }),
    onSuccess: async () => {
      toast.success("Muzakki berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menambahkan Muzakki";
      toast.error(errMsg);
    },
  });

  const update = useMutation({
    mutationFn: (data: any) => invoke("update_muzakki", { id: id!, data }),
    onSuccess: async () => {
      toast.success("Data Muzakki berhasil diperbarui!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal memperbarui data";
      toast.error(errMsg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_muzakki", { id }),
    onSuccess: async () => {
      toast.success("Muzakki berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_muzakkis"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menghapus Muzakki";
      toast.error(errMsg);
    },
  });

  return { store, update, remove };
};

// ── Mustahiq Hooks ──────────────────────────────────────────
export const useMustahiqData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_mustahiqs", params],
    queryFn: () => invoke<any>("list_mustahiq", { params: params || "" }),
  });
};

export const useMustahiqMutation = (id?: string) => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_mustahiq", { data }),
    onSuccess: async () => {
      toast.success("Mustahiq berhasil ditambahkan!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menambahkan Mustahiq";
      toast.error(errMsg);
    },
  });

  const update = useMutation({
    mutationFn: (data: any) => invoke("update_mustahiq", { id: id!, data }),
    onSuccess: async () => {
      toast.success("Data Mustahiq berhasil diperbarui!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal memperbarui data";
      toast.error(errMsg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_mustahiq", { id }),
    onSuccess: async () => {
      toast.success("Mustahiq berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_mustahiqs"] });
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menghapus Mustahiq";
      toast.error(errMsg);
    },
  });

  return { store, update, remove };
};

// ── Penerimaan Hooks ────────────────────────────────────────
export const usePenerimaanData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penerimaans", params],
    queryFn: () => invoke<any>("list_zakat_receipts", { params: params || "" }),
  });
};

export const usePenerimaanMutation = () => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_zakat_receipt", { data }),
    onSuccess: async () => {
      toast.success("Penerimaan zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal mencatat penerimaan";
      toast.error(errMsg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_zakat_receipt", { id }),
    onSuccess: async () => {
      toast.success("Penerimaan zakat berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penerimaans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menghapus penerimaan";
      toast.error(errMsg);
    },
  });

  return { store, remove };
};

// ── Penyaluran Hooks ────────────────────────────────────────
export const usePenyaluranData = (params?: string) => {
  return useQuery({
    queryKey: ["zakat_penyalurans", params],
    queryFn: () => invoke<any>("list_zakat_distributions", { params: params || "" }),
  });
};

export const usePenyaluranMutation = () => {
  const queryClient = useQueryClient();

  const store = useMutation({
    mutationFn: (data: any) => invoke("create_zakat_distribution", { data }),
    onSuccess: async () => {
      toast.success("Penyaluran zakat berhasil dicatat!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal mencatat penyaluran";
      toast.error(errMsg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke("delete_zakat_distribution", { id }),
    onSuccess: async () => {
      toast.success("Penyaluran zakat berhasil dihapus!");
      await queryClient.invalidateQueries({ queryKey: ["zakat_penyalurans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      const errMsg = typeof err === "string" ? err : err?.message || "Gagal menghapus penyaluran";
      toast.error(errMsg);
    },
  });

  return { store, remove };
};

import api from "@/lib/api";
import { PaginatedResponse, Transaction } from "@/types";

export interface KasSummary {
  pemasukan_bulan_ini: number;
  pengeluaran_bulan_ini: number;
  saldo_akhir_bulan: number;
  saldo_total_kas: number;
}

export const kasService = {
  getSummary: async (month: string | number, year: string | number) => {
    const res = await api.get(`/kas/summary?month=${month}&year=${year}`);
    return res.data?.data;
  },

  getAll: async (params: string) => {
    const res = await api.get(`/kas?${params}`);
    return res.data?.data;
  },

  create: async (data: any) => {
    return await api.post("/kas", data);
  },

  verify: async (id: string) => {
    return await api.put(`/kas/${id}/verify`);
  },

  delete: async (id: string) => {
    return await api.delete(`/kas/${id}`);
  },
};

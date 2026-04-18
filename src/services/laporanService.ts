import api from "@/lib/api";
import { invoke } from "@tauri-apps/api/core";

export interface LaporanSummary {
  pemasukan_bulan_ini: number;
  pengeluaran_bulan_ini: number;
  saldo_akhir_bulan: number;
  saldo_total_kas: number;
}

export interface LaporanBreakdownItem {
  category: string;
  total: number;
}

export interface LaporanBreakdown {
  pemasukan: LaporanBreakdownItem[];
  pengeluaran: LaporanBreakdownItem[];
}

export interface LaporanData {
  month: string;
  year: string;
  summary: LaporanSummary;
  breakdown: LaporanBreakdown;
}

export interface LaporanResponse {
  status: string;
  message: string;
  data: LaporanData;
}

export const laporanService = {
  /**
   * Fetch monthly financial report summary and breakdown.
   * Requires role: super_admin, bendahara, petugas_zakat, or viewer.
   */
  getLaporan: async (
    month: string | number,
    year: string | number,
  ): Promise<LaporanResponse> => {
    const res = await api.get<LaporanResponse>(`/laporan?month=${month}&year=${year}`);
    return res.data;
  },

  /**
   * Export monthly financial report to Excel (.xlsx) using Rust native dialog.
   * Returns the saved file path.
   */
  exportLaporan: async (
    month: string | number,
    year: string | number,
  ): Promise<string> => {
    return await invoke("export_laporan", {
      month: String(month),
      year: String(year),
    });
  },
};

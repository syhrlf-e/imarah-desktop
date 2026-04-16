import { useQuery } from "@tanstack/react-query";
import { laporanService, LaporanData } from "@/services/laporanService";
import { toast } from "sonner";
import axios from "axios";
import { useEffect } from "react";

/**
 * Fetches the monthly financial report (summary + breakdown).
 *
 * Handles common error scenarios:
 *  - 403 Forbidden → user lacks required role
 *  - Network errors → offline or backend unreachable
 */
export const useLaporan = (
  month: string | number,
  year: string | number,
) => {
  const query = useQuery<LaporanData, Error>({
    queryKey: ["laporan", month, year],
    queryFn: () => laporanService.getLaporan(month, year).then((res) => res.data),
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
  });

  // Side-effect: show toast on error
  useEffect(() => {
    if (!query.error) return;

    if (axios.isAxiosError(query.error)) {
      const status = query.error.response?.status;

      if (status === 403) {
        toast.error("Anda tidak memiliki akses ke laporan ini.");
      } else if (status === 401) {
        toast.error("Sesi berakhir. Silakan login ulang.");
      } else if (!query.error.response) {
        toast.error("Koneksi terputus. Periksa jaringan Anda.");
      } else {
        toast.error("Gagal memuat laporan. Silakan coba lagi.");
      }
    }
  }, [query.error]);

  return query;
};

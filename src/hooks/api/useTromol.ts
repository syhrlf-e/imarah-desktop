import { useQuery } from "@tanstack/react-query";
import { tromolService } from "@/services/tromolService";

export interface TromolBox {
  id: string;
  name: string;
  qr_code: string;
  location: string | null;
  status: "active" | "inactive";
  created_at: string;
  signed_url?: string;
}

export const useTromolData = () => {
  return useQuery({
    queryKey: ["tromol_boxes"],
    queryFn: async () => {
      const boxes = await tromolService.getAll();
      return boxes as TromolBox[];
    },
  });
};

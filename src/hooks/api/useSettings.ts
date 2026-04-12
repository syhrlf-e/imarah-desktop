import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

export interface SettingsData {
  masjid_name: string;
  masjid_address: string;
  contact_phone: string;
  zakat_fitrah_amount: string;
}

export const useSettingsData = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      return await settingsService.get();
    },
  });
};

export const useSettingsMutation = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (payload: SettingsData) => {
      return await settingsService.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return { update };
};

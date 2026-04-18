import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

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
      return await invoke<SettingsData>("get_settings");
    },
  });
};

export const useSettingsMutation = () => {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (payload: SettingsData) => {
      return await invoke("update_settings", { payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return { update };
};

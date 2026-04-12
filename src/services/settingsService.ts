import api from "@/lib/api";
import { SettingsData } from "@/hooks/api/useSettings";

export const settingsService = {
  get: async () => {
    const res = await api.get('/settings');
    return (res.data?.data?.settings ?? res.data?.data ?? {}) as SettingsData;
  },
  update: async (payload: SettingsData) => {
    const res = await api.put('/settings', payload);
    return res.data;
  }
};

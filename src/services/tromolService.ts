import api from "@/lib/api";

export const tromolService = {
  getAll: async () => {
    const res = await api.get('/tromol');
    return res.data?.data?.tromolBoxes ?? [];
  },
};

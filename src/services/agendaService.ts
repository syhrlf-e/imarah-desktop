import api from "@/lib/api";

export const agendaService = {
  getAll: async (params: string) => {
    const res = await api.get(`/agenda?${params}`);
    return res.data?.data?.agendas;
  },

  create: async (data: any) => {
    return await api.post("/agenda", data);
  },

  update: async (id: string, data: any) => {
    return await api.put(`/agenda/${id}`, data);
  },

  delete: async (id: string) => {
    return await api.delete(`/agenda/${id}`);
  },
};

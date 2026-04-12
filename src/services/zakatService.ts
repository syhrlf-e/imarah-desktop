import api from "@/lib/api";

// ── Types ─────────────────────────────────────────
export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface Muzakki {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  created_at?: string;
}

export interface Mustahiq {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  address: string | null;
  created_at?: string;
}

export interface ZakatPenerimaan {
  id: string;
  donatur_name: string;
  category: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface ZakatPenyaluran {
  id: string;
  mustahiq_name: string;
  type: string;
  amount: number;
  notes: string | null;
  date: string;
  created_at: string;
}

// ── Muzakki Service ───────────────────────────────
export const getMuzakkis = async (params?: string) => {
  const query = params ? `?${params}` : "";
  const res = await api.get(`/zakat/muzakki${query}`);
  // Return format laravel pagination atau data lurus
  return res.data?.data?.data ? res.data.data : res.data;
};

export const createMuzakki = async (data: Partial<Muzakki>) => {
  const res = await api.post("/zakat/muzakki", data);
  return res.data;
};

export const deleteMuzakki = async (id: string) => {
  const res = await api.delete(`/zakat/muzakki/${id}`);
  return res.data;
};

// ── Mustahiq Service ──────────────────────────────
export const getMustahiqs = async (params?: string) => {
  const query = params ? `?${params}` : "";
  const res = await api.get(`/zakat/mustahiq${query}`);
  return res.data?.data?.data ? res.data.data : res.data;
};

export const createMustahiq = async (data: Partial<Mustahiq>) => {
  const res = await api.post("/zakat/mustahiq", data);
  return res.data;
};

export const deleteMustahiq = async (id: string) => {
  const res = await api.delete(`/zakat/mustahiq/${id}`);
  return res.data;
};

// ── Penerimaan Service ────────────────────────────
export const getPenerimaan = async (params?: string) => {
  const query = params ? `?${params}` : "";
  const res = await api.get(`/zakat/penerimaan${query}`);
  return res.data?.data?.data ? res.data.data : res.data;
};

export const createPenerimaan = async (data: any) => {
  const res = await api.post("/zakat/penerimaan", data);
  return res.data;
};

export const deletePenerimaan = async (id: string) => {
  const res = await api.delete(`/zakat/penerimaan/${id}`);
  return res.data;
};

// ── Penyaluran Service ────────────────────────────
export const getPenyaluran = async (params?: string) => {
  const query = params ? `?${params}` : "";
  const res = await api.get(`/zakat/penyaluran${query}`);
  return res.data?.data?.data ? res.data.data : res.data;
};

export const createPenyaluran = async (data: any) => {
  const res = await api.post("/zakat/penyaluran", data);
  return res.data;
};

export const deletePenyaluran = async (id: string) => {
  const res = await api.delete(`/zakat/penyaluran/${id}`);
  return res.data;
};

// ── Core User & Auth ──────────────────────────────────────────────────────────

export interface User {
    id: string;
    name: string;
    email: string;
    role:
        | "super_admin"
        | "bendahara"
        | "petugas_zakat"
        | "sekretaris"
        | "viewer";
    is_active: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

// ── Domain Models ─────────────────────────────────────────────────────────────

export interface Donatur {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface TromolBox {
    id: string;
    name: string;
    qr_code: string;
    location?: string | null;   // null diizinkan (dari DB nullable)
    status: "active" | "inactive";
    created_at: string;
    updated_at?: string;
}

export interface Transaction {
    id: string;
    type: "in" | "out";
    category:
        | "zakat_fitrah"
        | "zakat_maal"
        | "infaq"
        | "infaq_tromol"
        | "operasional"
        | "gaji"
        | "lainnya";
    amount: number;
    payment_method?: "tunai" | "transfer" | "qris";
    notes?: string;
    donatur_id?: string;
    donatur?: Donatur;
    tromol_box_id?: string;
    tromol_box?: TromolBox;
    created_by: string;
    user?: User;
    verified_at?: string;
    verified_by?: string;
    verifier?: User;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url?: string;
    from: number | null;
    last_page: number;
    last_page_url?: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path?: string;
    per_page?: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

// ── Page Props (digunakan di komponen yang menerima data dari API) ─────────────

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth?: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
};

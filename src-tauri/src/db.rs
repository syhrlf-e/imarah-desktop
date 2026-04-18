use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "initial_setup",
            sql: "
                CREATE TABLE IF NOT EXISTS key_value_store (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS offline_queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL, -- e.g. 'POST', 'PUT', 'DELETE'
                    path TEXT NOT NULL,   -- e.g. '/api/v1/kas'
                    payload TEXT,         -- JSON string
                    status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'failed'
                    error_message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    role TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS agenda (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    location TEXT,
                    type TEXT NOT NULL,
                    speaker_name TEXT,
                    status TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS inventaris (
                    id TEXT PRIMARY KEY,
                    item_code TEXT,
                    item_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    condition TEXT NOT NULL,
                    location TEXT,
                    source TEXT NOT NULL,
                    source_details TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS kas_transactions (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    category TEXT NOT NULL,
                    amount REAL NOT NULL,
                    payment_method TEXT,
                    notes TEXT,
                    donatur_id TEXT,
                    donatur_name TEXT,
                    tromol_box_id TEXT,
                    tromol_box_name TEXT,
                    created_by TEXT NOT NULL,
                    creator_name TEXT,
                    verified_at DATETIME,
                    verified_by TEXT,
                    verifier_name TEXT,
                    status TEXT,
                    effective_date DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    deleted_at DATETIME
                );

                CREATE TABLE IF NOT EXISTS muzakki (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    jenis_kelamin TEXT,
                    jumlah_tanggungan INTEGER DEFAULT 0,
                    phone TEXT,
                    alamat TEXT,
                    rt TEXT,
                    rw TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS mustahiq (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    ashnaf TEXT,
                    address TEXT,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS zakat_receipts (
                    id TEXT PRIMARY KEY,
                    transaction_no TEXT,
                    effective_date DATETIME,
                    donatur_name TEXT,
                    category TEXT,
                    amount REAL,
                    notes TEXT,
                    status TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS zakat_distributions (
                    id TEXT PRIMARY KEY,
                    transaction_no TEXT,
                    effective_date DATETIME,
                    mustahiq_name TEXT,
                    category TEXT,
                    amount REAL,
                    notes TEXT,
                    status TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ",
            kind: MigrationKind::Up,
        }
    ]
}

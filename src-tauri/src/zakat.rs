use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth;
use tauri_plugin_sql::{DbInstances, DbPool};
use tauri_plugin_dialog::{DialogExt, FilePath};
use sqlx::{Row, Pool, Sqlite};
use reqwest::multipart;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct Muzakki {
    pub id: String,
    pub name: String,
    pub jenis_kelamin: String,
    pub jumlah_tanggungan: i32,
    pub phone: Option<String>,
    pub alamat: Option<String>,
    pub rt: Option<String>,
    pub rw: Option<String>,
    pub is_active: Value,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct ZakatMeta {
    pub current_page: i32,
    pub last_page: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct MuzakkiListResponse {
    pub data: Vec<Muzakki>,
    pub meta: ZakatMeta,
}

const DB_NAME: &str = "sqlite:imarah.db";

async fn get_sqlite_pool(db_instances: &State<'_, DbInstances>) -> Result<Pool<Sqlite>, String> {
    let instances = db_instances.0.read().await;
    let db_pool = instances.get(DB_NAME).ok_or("Database not found")?;

    match db_pool {
        DbPool::Sqlite(pool) => Ok(pool.clone()),
        #[allow(unreachable_patterns)]
        _ => Err("Database is not SQLite".to_string()),
    }
}

// ── Muzakki Commands ──────────────────────────────────────────

#[tauri::command]
pub async fn list_muzakki(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<MuzakkiListResponse, String> {
    let url = if params.is_empty() {
        format!("{}/zakat/muzakki", state.base_url)
    } else {
        format!("{}/zakat/muzakki?{}", state.base_url, params)
    };
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {

                let data_node = json_body.get("data").unwrap_or(&json_body);

                // Parse the array
                let items_val = data_node.get("muzakkis")
                    .and_then(|m| m.get("items"))
                    .unwrap_or(data_node);

                if let Ok(items) = serde_json::from_value::<Vec<Muzakki>>(items_val.clone()) {
                    let current_page = data_node.get("muzakkis").and_then(|m| m.get("meta")).and_then(|m| m.get("current_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let last_page = data_node.get("muzakkis").and_then(|m| m.get("meta")).and_then(|m| m.get("last_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let total = data_node.get("muzakkis").and_then(|m| m.get("meta")).and_then(|m| m.get("total")).and_then(|v| v.as_i64()).unwrap_or(items.len() as i64) as i32;

                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for item in &items {
                            let is_active_int = match &item.is_active {
                                Value::Bool(b) => if *b { 1 } else { 0 },
                                Value::Number(n) => n.as_i64().unwrap_or(1),
                                _ => 1,
                            };

                            let _ = sqlx::query(
                                "INSERT OR REPLACE INTO muzakki
                                (id, name, jenis_kelamin, jumlah_tanggungan, phone, alamat, rt, rw, is_active, created_at)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                                .bind(&item.id)
                                .bind(&item.name)
                                .bind(&item.jenis_kelamin)
                                .bind(item.jumlah_tanggungan)
                                .bind(&item.phone)
                                .bind(&item.alamat)
                                .bind(&item.rt)
                                .bind(&item.rw)
                                .bind(is_active_int)
                                .bind(&item.created_at)
                                .execute(&pool)
                                .await;
                        }
                    }

                    return Ok(MuzakkiListResponse {
                        data: items,
                        meta: ZakatMeta { current_page, last_page, total }
                    });
                }
            }
        }
    }

    // Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, name, jenis_kelamin, jumlah_tanggungan, phone, alamat, rt, rw, is_active, created_at FROM muzakki ORDER BY name ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        let is_active_int: i64 = row.get("is_active");
        items.push(Muzakki {
            id: row.get("id"),
            name: row.get("name"),
            jenis_kelamin: row.get("jenis_kelamin"),
            jumlah_tanggungan: row.get("jumlah_tanggungan"),
            phone: row.get("phone"),
            alamat: row.get("alamat"),
            rt: row.get("rt"),
            rw: row.get("rw"),
            is_active: Value::Bool(is_active_int > 0),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(MuzakkiListResponse {
        data: items,
        meta: ZakatMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
    })
}

#[tauri::command]
pub async fn create_muzakki(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/muzakki", state.base_url);
    let mut builder = state.client.post(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<Muzakki>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let is_active_int = match &item.is_active {
                    Value::Bool(b) => if *b { 1 } else { 0 },
                    Value::Number(n) => n.as_i64().unwrap_or(1),
                    _ => 1,
                };
                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO muzakki
                    (id, name, jenis_kelamin, jumlah_tanggungan, phone, alamat, rt, rw, is_active, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                    .bind(&item.id)
                    .bind(&item.name)
                    .bind(&item.jenis_kelamin)
                    .bind(item.jumlah_tanggungan)
                    .bind(&item.phone)
                    .bind(&item.alamat)
                    .bind(&item.rt)
                    .bind(&item.rw)
                    .bind(is_active_int)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal membuat muzakki ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn update_muzakki(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/muzakki/{}", state.base_url, id);
    let mut builder = state.client.put(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<Muzakki>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let is_active_int = match &item.is_active {
                    Value::Bool(b) => if *b { 1 } else { 0 },
                    Value::Number(n) => n.as_i64().unwrap_or(1),
                    _ => 1,
                };
                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO muzakki
                    (id, name, jenis_kelamin, jumlah_tanggungan, phone, alamat, rt, rw, is_active, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                    .bind(&item.id)
                    .bind(&item.name)
                    .bind(&item.jenis_kelamin)
                    .bind(item.jumlah_tanggungan)
                    .bind(&item.phone)
                    .bind(&item.alamat)
                    .bind(&item.rt)
                    .bind(&item.rw)
                    .bind(is_active_int)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal memperbarui muzakki ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_muzakki(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/zakat/muzakki/{}", state.base_url, id);
    let mut builder = state.client.delete(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        if let Ok(pool) = get_sqlite_pool(&db_instances).await {
            let _ = sqlx::query("DELETE FROM muzakki WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus muzakki ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn import_muzakki(
    app: AppHandle,
    state: State<'_, NetState>,
) -> Result<Value, String> {
    let file_path = app.dialog()
        .file()
        .add_filter("Excel/CSV", &["xlsx", "csv"])
        .blocking_pick_file()
        .ok_or("Import dibatalkan")?;

    let path_buf = match file_path {
        FilePath::Path(p) => p,
        FilePath::Url(u) => u.to_file_path().map_err(|_| "Invalid file path".to_string())?,
    };
    
    let file_path_str = path_buf.to_string_lossy().to_string();
    let file_bytes = std::fs::read(&path_buf).map_err(|e| e.to_string())?;
    let file_name = path_buf.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("import.xlsx")
        .to_string();

    let part = multipart::Part::bytes(file_bytes)
        .file_name(file_name)
        .mime_str("application/octet-stream")
        .map_err(|e| e.to_string())?;

    let form = multipart::Form::new().part("file", part);
    let url = format!("{}/zakat/muzakki/import", state.base_url);
    let mut builder = state.client.post(url).multipart(form);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        Ok(json)
    } else {
        Err(format!("Gagal import muzakki ({}): {}", status, json))
    }
    }

    #[tauri::command]
    pub async fn import_mustahiq(
    app: AppHandle,
    state: State<'_, NetState>,
    ) -> Result<Value, String> {
    let file_path = app.dialog()
        .file()
        .add_filter("Excel/CSV", &["xlsx", "csv"])
        .blocking_pick_file()
        .ok_or("Import dibatalkan")?;

    let path_buf = match file_path {
        FilePath::Path(p) => p,
        FilePath::Url(u) => u.to_file_path().map_err(|_| "Invalid file path".to_string())?,
    };
    
    let file_path_str = path_buf.to_string_lossy().to_string();
    let file_bytes = std::fs::read(&path_buf).map_err(|e| e.to_string())?;
    let file_name = path_buf.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("import.xlsx")
        .to_string();

    let part = multipart::Part::bytes(file_bytes)
        .file_name(file_name)
        .mime_str("application/octet-stream")
        .map_err(|e| e.to_string())?;

    let form = multipart::Form::new().part("file", part);
    let url = format!("{}/zakat/mustahiq/import", state.base_url);
    let mut builder = state.client.post(url).multipart(form);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        Ok(json)
    } else {
        Err(format!("Gagal import mustahiq ({}): {}", status, json))
    }
    }

    // ── Zakat Receipt Commands ────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct Mustahiq {
    pub id: String,
    pub name: String,
    pub ashnaf: String,
    pub address: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct MustahiqListResponse {
    pub data: Vec<Mustahiq>,
    pub meta: ZakatMeta,
}

#[tauri::command]
pub async fn list_mustahiq(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<MustahiqListResponse, String> {
    let url = if params.is_empty() {
        format!("{}/zakat/mustahiq", state.base_url)
    } else {
        format!("{}/zakat/mustahiq?{}", state.base_url, params)
    };
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                let data_node = json_body.get("data").unwrap_or(&json_body);

                let items_val = data_node.get("mustahiqs")
                    .and_then(|m| m.get("items"))
                    .unwrap_or(data_node);

                if let Ok(items) = serde_json::from_value::<Vec<Mustahiq>>(items_val.clone()) {
                    let current_page = data_node.get("mustahiqs").and_then(|m| m.get("meta")).and_then(|m| m.get("current_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let last_page = data_node.get("mustahiqs").and_then(|m| m.get("meta")).and_then(|m| m.get("last_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let total = data_node.get("mustahiqs").and_then(|m| m.get("meta")).and_then(|m| m.get("total")).and_then(|v| v.as_i64()).unwrap_or(items.len() as i64) as i32;

                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for item in &items {
                            let _ = sqlx::query(
                                "INSERT OR REPLACE INTO mustahiq
                                (id, name, ashnaf, address, description, created_at)
                                VALUES ($1, $2, $3, $4, $5, $6)")
                                .bind(&item.id)
                                .bind(&item.name)
                                .bind(&item.ashnaf)
                                .bind(&item.address)
                                .bind(&item.description)
                                .bind(&item.created_at)
                                .execute(&pool)
                                .await;
                        }
                    }

                    return Ok(MustahiqListResponse {
                        data: items,
                        meta: ZakatMeta { current_page, last_page, total }
                    });
                }
            }
        }
    }

    // Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, name, ashnaf, address, description, created_at FROM mustahiq ORDER BY name ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(Mustahiq {
            id: row.get("id"),
            name: row.get("name"),
            ashnaf: row.get("ashnaf"),
            address: row.get("address"),
            description: row.get("description"),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(MustahiqListResponse {
        data: items,
        meta: ZakatMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
    })
}

#[tauri::command]
pub async fn create_mustahiq(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/mustahiq", state.base_url);
    let mut builder = state.client.post(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<Mustahiq>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO mustahiq
                    (id, name, ashnaf, address, description, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)")
                    .bind(&item.id)
                    .bind(&item.name)
                    .bind(&item.ashnaf)
                    .bind(&item.address)
                    .bind(&item.description)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal membuat mustahiq ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn update_mustahiq(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/mustahiq/{}", state.base_url, id);
    let mut builder = state.client.put(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<Mustahiq>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO mustahiq
                    (id, name, ashnaf, address, description, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)")
                    .bind(&item.id)
                    .bind(&item.name)
                    .bind(&item.ashnaf)
                    .bind(&item.address)
                    .bind(&item.description)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal memperbarui mustahiq ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_mustahiq(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/zakat/mustahiq/{}", state.base_url, id);
    let mut builder = state.client.delete(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        if let Ok(pool) = get_sqlite_pool(&db_instances).await {
            let _ = sqlx::query("DELETE FROM mustahiq WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus mustahiq ({}): {}", status, json))
    }
}

// ── Zakat Receipt Commands ────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct ZakatReceipt {
    pub id: String,
    pub transaction_no: Option<String>,
    pub effective_date: Option<String>,
    pub donatur_name: Option<String>,
    pub category: Option<String>,
    pub amount: Option<f64>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct SimpleMuzakki {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct ZakatReceiptListResponse {
    pub data: Vec<ZakatReceipt>,
    pub meta: ZakatMeta,
    pub muzakkis: Vec<SimpleMuzakki>,
}

#[tauri::command]
pub async fn list_zakat_receipts(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<ZakatReceiptListResponse, String> {
    let url = if params.is_empty() {
        format!("{}/zakat/penerimaan", state.base_url)
    } else {
        format!("{}/zakat/penerimaan?{}", state.base_url, params)
    };
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                let data_node = json_body.get("data").unwrap_or(&json_body);

                let items_val = data_node.get("transactions")
                    .and_then(|t| t.get("items"))
                    .unwrap_or(data_node);

                let muzakkis_val = data_node.get("muzakkis");

                if let Ok(items) = serde_json::from_value::<Vec<ZakatReceipt>>(items_val.clone()) {
                    let current_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("current_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let last_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("last_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let total = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("total")).and_then(|v| v.as_i64()).unwrap_or(items.len() as i64) as i32;

                    let muzakkis = muzakkis_val.and_then(|v| serde_json::from_value::<Vec<SimpleMuzakki>>(v.clone()).ok()).unwrap_or_default();

                    // Update local SQLite cache in background
                    let pool_clone = db_instances.0.read().await.get(DB_NAME).and_then(|p| if let DbPool::Sqlite(pool) = p { Some(pool.clone()) } else { None });
                    if let Some(pool) = pool_clone {
                        let items_clone = items.clone();
                        tauri::async_runtime::spawn(async move {
                            for item in items_clone {
                                let _ = sqlx::query(
                                    "INSERT OR REPLACE INTO zakat_receipts
                                    (id, transaction_no, effective_date, donatur_name, category, amount, notes, status, created_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)")
                                    .bind(&item.id)
                                    .bind(&item.transaction_no)
                                    .bind(&item.effective_date)
                                    .bind(&item.donatur_name)
                                    .bind(&item.category)
                                    .bind(item.amount)
                                    .bind(&item.notes)
                                    .bind(&item.status)
                                    .bind(&item.created_at)
                                    .execute(&pool)
                                    .await;
                            }
                        });
                    }

                    return Ok(ZakatReceiptListResponse {
                        data: items,
                        meta: ZakatMeta { current_page, last_page, total },
                        muzakkis,
                    });
                }
            }
        }
    }

    // Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let sort_order = if params.contains("order=asc") { "ASC" } else { "DESC" };
    let query = format!(
        "SELECT id, transaction_no, effective_date, donatur_name, category, amount, notes, status, created_at 
         FROM zakat_receipts 
         WHERE status != 'voided' OR status IS NULL 
         ORDER BY effective_date {}, created_at DESC", 
        sort_order
    );

    let rows = sqlx::query(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(ZakatReceipt {
            id: row.get("id"),
            transaction_no: row.get("transaction_no"),
            effective_date: row.get("effective_date"),
            donatur_name: row.get("donatur_name"),
            category: row.get("category"),
            amount: row.get("amount"),
            notes: row.get("notes"),
            status: row.get("status"),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(ZakatReceiptListResponse {
        data: items,
        meta: ZakatMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
        muzakkis: Vec::new(), // In offline mode, we might not have the full muzakki list here
    })
}

#[tauri::command]
pub async fn create_zakat_receipt(
    app: AppHandle,
    state: State<'_, NetState>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/penerimaan", state.base_url);
    let mut builder = state.client.post(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        Ok(json)
    } else {
        Err(format!("Gagal mencatat zakat ({}): {}", status, json))
    }
}

// ── Zakat Distribution Commands ────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct ZakatDistribution {
    pub id: String,
    pub transaction_no: Option<String>,
    pub effective_date: Option<String>,
    pub mustahiq_name: Option<String>,
    pub category: Option<String>,
    pub amount: Option<f64>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct SimpleMustahiq {
    pub id: String,
    pub name: String,
    pub ashnaf: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct ZakatDistributionListResponse {
    pub data: Vec<ZakatDistribution>,
    pub meta: ZakatMeta,
    pub mustahiqs: Vec<SimpleMustahiq>,
}

#[tauri::command]
pub async fn list_zakat_distributions(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<ZakatDistributionListResponse, String> {
    let url = if params.is_empty() {
        format!("{}/zakat/penyaluran", state.base_url)
    } else {
        format!("{}/zakat/penyaluran?{}", state.base_url, params)
    };
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                let data_node = json_body.get("data").unwrap_or(&json_body);

                let items_val = data_node.get("transactions")
                    .and_then(|t| t.get("items"))
                    .unwrap_or(data_node);

                let _muzakkis_val = data_node.get("muzakkis"); 
                let mustahiqs_val = data_node.get("mustahiqs");

                if let Ok(items) = serde_json::from_value::<Vec<ZakatDistribution>>(items_val.clone()) {
                    let current_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("current_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let last_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("last_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let total = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("total")).and_then(|v| v.as_i64()).unwrap_or(items.len() as i64) as i32;

                    let mustahiqs = mustahiqs_val.and_then(|v| serde_json::from_value::<Vec<SimpleMustahiq>>(v.clone()).ok()).unwrap_or_default();

                    // Update local SQLite cache in background
                    let pool_clone = db_instances.0.read().await.get(DB_NAME).and_then(|p| if let DbPool::Sqlite(pool) = p { Some(pool.clone()) } else { None });
                    if let Some(pool) = pool_clone {
                        let items_clone = items.clone();
                        tauri::async_runtime::spawn(async move {
                            for item in items_clone {
                                let _ = sqlx::query(
                                    "INSERT OR REPLACE INTO zakat_distributions
                                    (id, transaction_no, effective_date, mustahiq_name, category, amount, notes, status, created_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)")
                                    .bind(&item.id)
                                    .bind(&item.transaction_no)
                                    .bind(&item.effective_date)
                                    .bind(&item.mustahiq_name)
                                    .bind(&item.category)
                                    .bind(item.amount)
                                    .bind(&item.notes)
                                    .bind(&item.status)
                                    .bind(&item.created_at)
                                    .execute(&pool)
                                    .await;
                            }
                        });
                    }

                    return Ok(ZakatDistributionListResponse {
                        data: items,
                        meta: ZakatMeta { current_page, last_page, total },
                        mustahiqs,
                    });
                }
            }
        }
    }

    // Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let sort_order = if params.contains("order=asc") { "ASC" } else { "DESC" };
    let query = format!(
        "SELECT id, transaction_no, effective_date, mustahiq_name, category, amount, notes, status, created_at 
         FROM zakat_distributions 
         WHERE status != 'voided' OR status IS NULL 
         ORDER BY effective_date {}, created_at DESC", 
        sort_order
    );

    let rows = sqlx::query(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(ZakatDistribution {
            id: row.get("id"),
            transaction_no: row.get("transaction_no"),
            effective_date: row.get("effective_date"),
            mustahiq_name: row.get("mustahiq_name"),
            category: row.get("category"),
            amount: row.get("amount"),
            notes: row.get("notes"),
            status: row.get("status"),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(ZakatDistributionListResponse {
        data: items,
        meta: ZakatMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
        mustahiqs: Vec::new(),
    })
}

#[tauri::command]
pub async fn create_zakat_distribution(
    app: AppHandle,
    state: State<'_, NetState>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/zakat/penyaluran", state.base_url);
    let mut builder = state.client.post(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        Ok(json)
    } else {
        Err(format!("Gagal mencatat penyaluran zakat ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_zakat_distribution(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/zakat/penyaluran/{}", state.base_url, id);
    let mut builder = state.client.delete(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        if let Ok(pool) = get_sqlite_pool(&db_instances).await {
            let _ = sqlx::query("DELETE FROM zakat_distributions WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus penyaluran zakat ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_zakat_receipt(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/zakat/penerimaan/{}", state.base_url, id);
    let mut builder = state.client.delete(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        if let Ok(pool) = get_sqlite_pool(&db_instances).await {
            let _ = sqlx::query("DELETE FROM zakat_receipts WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus penerimaan zakat ({}): {}", status, json))
    }
}

#[derive(Deserialize)]
pub struct ZakatCalculationPayload {
    #[serde(rename = "type")]
    zakat_type: String,
    amount: Option<String>,
    jiwa: Option<String>,
    nominal_per_jiwa: Option<String>,
}

#[derive(Serialize)]
pub struct ZakatCalculationResponse {
    amount: f64,
}

#[tauri::command]
pub fn calculate_zakat(payload: ZakatCalculationPayload) -> Result<ZakatCalculationResponse, String> {
    if payload.zakat_type == "fitrah" {
        let jiwa = payload.jiwa.and_then(|j| j.parse::<f64>().ok()).unwrap_or(1.0);
        let nominal = payload.nominal_per_jiwa.and_then(|n| n.parse::<f64>().ok()).unwrap_or(0.0);
        Ok(ZakatCalculationResponse {
            amount: jiwa * nominal,
        })
    } else if payload.zakat_type == "maal" {
        let amount = payload.amount.and_then(|a| a.parse::<f64>().ok()).unwrap_or(0.0);
        // Assuming 2.5% for zakat maal
        Ok(ZakatCalculationResponse {
            amount: amount * 0.025,
        })
    } else {
        Err("Invalid zakat type".to_string())
    }
}

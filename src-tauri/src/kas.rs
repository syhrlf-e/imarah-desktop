use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth;
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KasSummary {
    pub pemasukan_bulan_ini: Value,
    pub pengeluaran_bulan_ini: Value,
    pub saldo_akhir_bulan: Value,
    pub saldo_total_kas: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct DonaturInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct TromolBoxInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct KasTransaction {
    pub id: String,
    pub r#type: Option<String>,
    pub category: Option<String>,
    pub amount: Option<f64>,
    pub payment_method: Option<String>,
    pub notes: Option<String>,
    pub donatur_id: Option<String>,
    pub donatur: Option<DonaturInfo>,
    pub tromol_box_id: Option<String>,
    pub tromol_box: Option<TromolBoxInfo>,
    pub created_by: Option<String>,
    pub user: Option<UserInfo>,
    pub verified_at: Option<String>,
    pub verified_by: Option<String>,
    pub verifier: Option<UserInfo>,
    pub status: Option<String>,
    pub effective_date: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct KasMeta {
    pub current_page: i32,
    pub last_page: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct KasResponse {
    pub data: Vec<KasTransaction>,
    pub current_page: i32,
    pub last_page: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct KasListResponse {
    pub data: Vec<KasTransaction>,
    pub meta: KasMeta,
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

#[tauri::command]
pub async fn get_kas_summary(
    app: AppHandle,
    state: State<'_, NetState>,
    month: String,
    year: String,
) -> Result<KasSummary, String> {
    let url = format!("{}/kas/summary?month={}&year={}", state.base_url, month, year);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    
    if status.is_success() {
        let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));
        let summary_val = json.get("data").and_then(|d| d.get("summary")).or(json.get("data")).unwrap_or(&json);
        
        if let Ok(summary) = serde_json::from_value::<KasSummary>(summary_val.clone()) {
            return Ok(summary);
        }
        Err(format!("Gagal parsing response Kas Summary dari: {}", summary_val))
    } else {
        // Fallback calculation logic from SQLite could be added here later
        Err(format!("Gagal memuat ringkasan kas ({}): {}", status, text))
    }
}

#[tauri::command]
pub async fn list_kas_transactions(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<KasListResponse, String> {
    // 1. Sync from Laravel
    let url = format!("{}/kas?{}", state.base_url, params);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                // Determine if pagination is structured under 'data' or directly
                let data_node = json_body.get("data").unwrap_or(&json_body);
                
                // We'll parse the array manually
                let items_val = data_node.get("transactions")
                    .and_then(|t| t.get("items"))
                    .unwrap_or(data_node);
                
                if let Ok(items) = serde_json::from_value::<Vec<KasTransaction>>(items_val.clone()) {
                    let current_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("current_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let last_page = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("last_page")).and_then(|v| v.as_i64()).unwrap_or(1) as i32;
                    let total = data_node.get("transactions").and_then(|t| t.get("meta")).and_then(|m| m.get("total")).and_then(|v| v.as_i64()).unwrap_or(items.len() as i64) as i32;

                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for item in &items {
                            let donatur_name = item.donatur.as_ref().map(|d| d.name.clone());
                            let tromol_name = item.tromol_box.as_ref().map(|t| t.name.clone());
                            let creator_name = item.user.as_ref().map(|u| u.name.clone());
                            let verifier_name = item.verifier.as_ref().map(|v| v.name.clone());

                            let _ = sqlx::query(
                                "INSERT OR REPLACE INTO kas_transactions 
                                (id, type, category, amount, payment_method, notes, donatur_id, donatur_name, tromol_box_id, tromol_box_name, created_by, creator_name, verified_at, verified_by, verifier_name, status, effective_date, created_at, updated_at, deleted_at) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)")
                                .bind(&item.id)
                                .bind(&item.r#type)
                                .bind(&item.category)
                                .bind(item.amount)
                                .bind(&item.payment_method)
                                .bind(&item.notes)
                                .bind(&item.donatur_id)
                                .bind(&donatur_name)
                                .bind(&item.tromol_box_id)
                                .bind(&tromol_name)
                                .bind(&item.created_by)
                                .bind(&creator_name)
                                .bind(&item.verified_at)
                                .bind(&item.verified_by)
                                .bind(&verifier_name)
                                .bind(&item.status)
                                .bind(&item.effective_date)
                                .bind(&item.created_at)
                                .bind(&item.updated_at)
                                .bind(&item.deleted_at)
                                .execute(&pool)
                                .await;
                        }
                    }

                    return Ok(KasListResponse {
                        data: items,
                        meta: KasMeta { current_page, last_page, total }
                    });
                }
            }
        }
    }

    // 2. Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, type, category, amount, payment_method, notes, donatur_id, donatur_name, tromol_box_id, tromol_box_name, created_by, creator_name, verified_at, verified_by, verifier_name, status, effective_date, created_at, updated_at, deleted_at FROM kas_transactions WHERE deleted_at IS NULL ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        let donatur_name: Option<String> = row.get("donatur_name");
        let donatur = donatur_name.map(|name| DonaturInfo { id: row.get::<Option<String>, _>("donatur_id").unwrap_or_default(), name });
        
        let tromol_name: Option<String> = row.get("tromol_box_name");
        let tromol_box = tromol_name.map(|name| TromolBoxInfo { id: row.get::<Option<String>, _>("tromol_box_id").unwrap_or_default(), name });

        let creator_name: Option<String> = row.get("creator_name");
        let user = creator_name.map(|name| UserInfo { id: row.get::<Option<String>, _>("created_by").unwrap_or_default(), name });

        let verifier_name: Option<String> = row.get("verifier_name");
        let verifier = verifier_name.map(|name| UserInfo { id: row.get::<Option<String>, _>("verified_by").unwrap_or_default(), name });

        items.push(KasTransaction {
            id: row.get("id"),
            r#type: row.get("type"),
            category: row.get("category"),
            amount: row.get("amount"),
            payment_method: row.get("payment_method"),
            notes: row.get("notes"),
            donatur_id: row.get("donatur_id"),
            donatur,
            tromol_box_id: row.get("tromol_box_id"),
            tromol_box,
            created_by: row.get("created_by"),
            user,
            verified_at: row.get("verified_at"),
            verified_by: row.get("verified_by"),
            verifier,
            status: row.get("status"),
            effective_date: row.get("effective_date"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
            deleted_at: row.get("deleted_at"),
        });
    }

    let total = items.len() as i32;
    Ok(KasListResponse {
        data: items,
        meta: KasMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
    })
}

#[tauri::command]
pub async fn create_kas_transaction(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/kas", state.base_url);
    let mut builder = state.client.post(url).json(&data);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        // Sync cache on success
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<KasTransaction>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let donatur_name = item.donatur.as_ref().map(|d| d.name.clone());
                let tromol_name = item.tromol_box.as_ref().map(|t| t.name.clone());
                let creator_name = item.user.as_ref().map(|u| u.name.clone());
                let verifier_name = item.verifier.as_ref().map(|v| v.name.clone());

                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO kas_transactions 
                    (id, type, category, amount, payment_method, notes, donatur_id, donatur_name, tromol_box_id, tromol_box_name, created_by, creator_name, verified_at, verified_by, verifier_name, created_at, updated_at, deleted_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)")
                    .bind(&item.id)
                    .bind(&item.r#type)
                    .bind(&item.category)
                    .bind(item.amount)
                    .bind(&item.payment_method)
                    .bind(&item.notes)
                    .bind(&item.donatur_id)
                    .bind(&donatur_name)
                    .bind(&item.tromol_box_id)
                    .bind(&tromol_name)
                    .bind(&item.created_by)
                    .bind(&creator_name)
                    .bind(&item.verified_at)
                    .bind(&item.verified_by)
                    .bind(&verifier_name)
                    .bind(&item.created_at)
                    .bind(&item.updated_at)
                    .bind(&item.deleted_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        // TODO: Enqueue to offline_queue if offline, but for now we throw error directly.
        Err(format!("Gagal membuat transaksi ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn verify_kas_transaction(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/kas/{}/verify", state.base_url, id);
    let mut builder = state.client.put(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if status.is_success() {
        let item_val = json.get("data").unwrap_or(&json);
        if let Ok(item) = serde_json::from_value::<KasTransaction>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query(
                    "UPDATE kas_transactions SET verified_at = $1, verified_by = $2, verifier_name = $3 WHERE id = $4")
                    .bind(&item.verified_at)
                    .bind(&item.verified_by)
                    .bind(&item.verifier.as_ref().map(|v| v.name.clone()))
                    .bind(&id)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal verifikasi transaksi ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_kas_transaction(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/kas/{}", state.base_url, id);
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
            // Soft delete locally
            let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
            let _ = sqlx::query("UPDATE kas_transactions SET deleted_at = $1 WHERE id = $2")
                .bind(now)
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus transaksi ({}): {}", status, json))
    }
}

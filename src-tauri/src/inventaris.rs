use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth;
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryItem {
    pub id: String,
    pub item_code: Option<String>,
    pub item_name: String,
    pub category: String,
    pub quantity: i32,
    pub condition: String,
    pub location: Option<String>,
    pub source: String,
    pub source_details: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventarisMeta {
    pub current_page: i32,
    pub last_page: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventarisResponse {
    pub items: Vec<InventoryItem>,
    pub meta: InventarisMeta,
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
pub async fn list_inventaris(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<InventarisResponse, String> {
    // 1. Sync from Laravel
    let url = format!("{}/inventaris?{}", state.base_url, params);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                let data = json_body.get("data").unwrap_or(&json_body);
                
                if let Ok(inventaris_res) = serde_json::from_value::<InventarisResponse>(data.clone()) {
                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for item in &inventaris_res.items {
                            let _ = sqlx::query("INSERT OR REPLACE INTO inventaris (id, item_code, item_name, category, quantity, condition, location, source, source_details, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
                                .bind(&item.id)
                                .bind(&item.item_code)
                                .bind(&item.item_name)
                                .bind(&item.category)
                                .bind(item.quantity)
                                .bind(&item.condition)
                                .bind(&item.location)
                                .bind(&item.source)
                                .bind(&item.source_details)
                                .bind(&item.notes)
                                .bind(&item.created_at)
                                .execute(&pool)
                                .await;
                        }
                    }
                    return Ok(inventaris_res);
                }
            }
        }
    }

    // 2. Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, item_code, item_name, category, quantity, condition, location, source, source_details, notes, created_at FROM inventaris ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(InventoryItem {
            id: row.get("id"),
            item_code: row.get("item_code"),
            item_name: row.get("item_name"),
            category: row.get("category"),
            quantity: row.get("quantity"),
            condition: row.get("condition"),
            location: row.get("location"),
            source: row.get("source"),
            source_details: row.get("source_details"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(InventarisResponse {
        items,
        meta: InventarisMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
    })
}

#[tauri::command]
pub async fn create_inventaris(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/inventaris", state.base_url);
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
        if let Ok(item) = serde_json::from_value::<InventoryItem>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query("INSERT OR REPLACE INTO inventaris (id, item_code, item_name, category, quantity, condition, location, source, source_details, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
                    .bind(&item.id)
                    .bind(&item.item_code)
                    .bind(&item.item_name)
                    .bind(&item.category)
                    .bind(item.quantity)
                    .bind(&item.condition)
                    .bind(&item.location)
                    .bind(&item.source)
                    .bind(&item.source_details)
                    .bind(&item.notes)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal membuat inventaris ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn update_inventaris(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/inventaris/{}", state.base_url, id);
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
        if let Ok(item) = serde_json::from_value::<InventoryItem>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query("INSERT OR REPLACE INTO inventaris (id, item_code, item_name, category, quantity, condition, location, source, source_details, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)")
                    .bind(&item.id)
                    .bind(&item.item_code)
                    .bind(&item.item_name)
                    .bind(&item.category)
                    .bind(item.quantity)
                    .bind(&item.condition)
                    .bind(&item.location)
                    .bind(&item.source)
                    .bind(&item.source_details)
                    .bind(&item.notes)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal memperbarui inventaris ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_inventaris(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/inventaris/{}", state.base_url, id);
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
            let _ = sqlx::query("DELETE FROM inventaris WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus inventaris ({}): {}", status, json))
    }
}

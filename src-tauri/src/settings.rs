use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth;
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SettingsData {
    pub masjid_name: String,
    pub masjid_address: String,
    pub contact_phone: String,
    pub zakat_fitrah_amount: String,
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
pub async fn get_settings(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
) -> Result<SettingsData, String> {
    // 1. Try to get from Laravel first (Sync)
    let url = format!("{}/settings", state.base_url);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<serde_json::Value>().await {
                let settings_val = json_body.get("data").and_then(|d| d.get("settings")).or(json_body.get("data")).unwrap_or(&json_body);
                
                if let Ok(settings) = serde_json::from_value::<SettingsData>(settings_val.clone()) {
                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        let settings_str = serde_json::to_string(&settings).unwrap_or_default();
                        let _ = sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES ('main', $1)")
                            .bind(settings_str)
                            .execute(&pool)
                            .await;
                    }
                    return Ok(settings);
                }
            }
        }
    }

    // 2. Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let row = sqlx::query("SELECT value FROM settings WHERE key = 'main'")
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(r) = row {
        let value: String = r.get("value");
        if let Ok(settings) = serde_json::from_str::<SettingsData>(&value) {
            return Ok(settings);
        }
    }

    Err("Gagal memuat pengaturan (Offline & No Cache)".to_string())
}

#[tauri::command]
pub async fn update_settings(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    payload: SettingsData,
) -> Result<Value, String> {
    // 1. Update Laravel
    let url = format!("{}/settings", state.base_url);
    let mut builder = state.client.put(url).json(&payload);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let json: Value = response.json().await.map_err(|e| e.to_string())?;

    if status.is_success() {
        // 2. Update Local SQLite on success
        if let Ok(pool) = get_sqlite_pool(&db_instances).await {
            let settings_str = serde_json::to_string(&payload).unwrap_or_default();
            let _ = sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES ('main', $1)")
                .bind(settings_str)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal update settings: {}", json))
    }
}

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth;
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Agenda {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: Option<String>,
    pub location: Option<String>,
    pub r#type: String,
    pub speaker_name: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgendaMeta {
    pub current_page: i32,
    pub last_page: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgendaResponse {
    pub items: Vec<Agenda>,
    pub meta: AgendaMeta,
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
pub async fn list_agenda(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    params: String,
) -> Result<AgendaResponse, String> {
    let url = format!("{}/agenda?{}", state.base_url, params);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<Value>().await {
                let data = json_body.get("data").and_then(|d| d.get("agendas")).unwrap_or(&json_body);
                
                if let Ok(agenda_res) = serde_json::from_value::<AgendaResponse>(data.clone()) {
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for item in &agenda_res.items {
                            let _ = sqlx::query("INSERT OR REPLACE INTO agenda (id, title, description, start_time, end_time, location, type, speaker_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                                .bind(&item.id)
                                .bind(&item.title)
                                .bind(&item.description)
                                .bind(&item.start_time)
                                .bind(&item.end_time)
                                .bind(&item.location)
                                .bind(&item.r#type)
                                .bind(&item.speaker_name)
                                .bind(&item.status)
                                .bind(&item.created_at)
                                .execute(&pool)
                                .await;
                        }
                    }
                    return Ok(agenda_res);
                }
            }
        }
    }

    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, title, description, start_time, end_time, location, type, speaker_name, status, created_at FROM agenda ORDER BY start_time DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for row in rows {
        items.push(Agenda {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            start_time: row.get("start_time"),
            end_time: row.get("end_time"),
            location: row.get("location"),
            r#type: row.get("type"),
            speaker_name: row.get("speaker_name"),
            status: row.get("status"),
            created_at: row.get("created_at"),
        });
    }

    let total = items.len() as i32;
    Ok(AgendaResponse {
        items,
        meta: AgendaMeta {
            current_page: 1,
            last_page: 1,
            total,
        },
    })
}

#[tauri::command]
pub async fn create_agenda(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/agenda", state.base_url);
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
        if let Ok(item) = serde_json::from_value::<Agenda>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query("INSERT OR REPLACE INTO agenda (id, title, description, start_time, end_time, location, type, speaker_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                    .bind(&item.id)
                    .bind(&item.title)
                    .bind(&item.description)
                    .bind(&item.start_time)
                    .bind(&item.end_time)
                    .bind(&item.location)
                    .bind(&item.r#type)
                    .bind(&item.speaker_name)
                    .bind(&item.status)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal membuat agenda ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn update_agenda(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
    data: Value,
) -> Result<Value, String> {
    let url = format!("{}/agenda/{}", state.base_url, id);
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
        if let Ok(item) = serde_json::from_value::<Agenda>(item_val.clone()) {
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query("INSERT OR REPLACE INTO agenda (id, title, description, start_time, end_time, location, type, speaker_name, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)")
                    .bind(&item.id)
                    .bind(&item.title)
                    .bind(&item.description)
                    .bind(&item.start_time)
                    .bind(&item.end_time)
                    .bind(&item.location)
                    .bind(&item.r#type)
                    .bind(&item.speaker_name)
                    .bind(&item.status)
                    .bind(&item.created_at)
                    .execute(&pool)
                    .await;
            }
        }
        Ok(json)
    } else {
        Err(format!("Gagal memperbarui agenda ({}): {}", status, json))
    }
}

#[tauri::command]
pub async fn delete_agenda(
    app: AppHandle,
    state: State<'_ , NetState>,
    db_instances: State<'_, DbInstances>,
    id: String,
) -> Result<Value, String> {
    let url = format!("{}/agenda/{}", state.base_url, id);
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
            let _ = sqlx::query("DELETE FROM agenda WHERE id = $1")
                .bind(&id)
                .execute(&pool)
                .await;
        }
        Ok(json)
    } else {
        Err(format!("Gagal menghapus agenda ({}): {}", status, json))
    }
}

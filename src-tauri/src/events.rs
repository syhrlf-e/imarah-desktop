use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use crate::auth;
use crate::net::NetState;
use tokio::time::{sleep, Duration};
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChallengeStatus {
    pub status: String,
    pub token: String,
}

#[tauri::command]
pub async fn start_challenge_listener(
    app: AppHandle,
    state: State<'_, NetState>,
    token: String,
) -> Result<(), String> {
    let app_clone = app.clone();
    let state_clone = state.inner().client.clone();
    let base_url = state.inner().base_url.clone();
    let token_clone = token.clone();

    // Run in background
    tauri::async_runtime::spawn(async move {
        let mut status = "waiting".to_string();
        
        while status == "waiting" {
            let url = format!("{}/auth/challenge/{}/status", base_url, token_clone);
            let mut builder = state_clone.get(&url);

            if let Some(auth_token) = auth::get_token(&app_clone) {
                builder = builder.bearer_auth(auth_token);
            }

            match builder.send().await {
                Ok(response) => {
                    if let Ok(json) = response.json::<serde_json::Value>().await {
                        if let Some(new_status) = json.get("status").and_then(|v| v.as_str()) {
                            if new_status != status {
                                status = new_status.to_string();
                                let _ = app_clone.emit("challenge-status-changed", ChallengeStatus {
                                    status: status.clone(),
                                    token: token_clone.clone(),
                                });
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Challenge polling error: {}", e);
                }
            }

            if status == "waiting" {
                sleep(Duration::from_secs(2)).await;
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn start_app_pulse(
    app: AppHandle,
    state: State<'_, NetState>,
) -> Result<(), String> {
    let app_clone = app.clone();
    let state_clone = state.inner().client.clone();
    let base_url = state.inner().base_url.clone();

    tauri::async_runtime::spawn(async move {
        loop {
            let token = auth::get_token(&app_clone);
            
            if let Some(auth_token) = token {
                // 1. Heartbeat & Session Check
                let hb_url = format!("{}/session-heartbeat", base_url);
                match state_clone.get(&hb_url).bearer_auth(&auth_token).send().await {
                    Ok(res) => {
                        if res.status() == reqwest::StatusCode::UNAUTHORIZED || res.status() == reqwest::StatusCode::FORBIDDEN {
                            let _ = auth::clear_auth_data(app_clone.clone()).await;
                            let _ = app_clone.emit("session-revoked", ());
                        } else if res.status().is_success() {
                            let _ = app_clone.emit("network-status", "online");
                        }
                    }
                    Err(_) => {
                        let _ = app_clone.emit("network-status", "offline");
                    }
                }

                // 2. Incoming Challenge Check (Approver side)
                let challenge_url = format!("{}/auth/challenge/check", base_url);
                if let Ok(res) = state_clone.get(&challenge_url).bearer_auth(&auth_token).send().await {
                    if let Ok(json) = res.json::<serde_json::Value>().await {
                        if let Some(challenge) = json.get("data").and_then(|d| d.get("challenge")) {
                            if !challenge.is_null() {
                                let _ = app_clone.emit("incoming-challenge", challenge);
                            }
                        }
                    }
                }
            } else {
                // Not logged in, only check network
                match state_clone.get(&base_url).send().await {
                    Ok(_) => { let _ = app_clone.emit("network-status", "online"); }
                    Err(_) => { let _ = app_clone.emit("network-status", "offline"); }
                }
            }

            // Sleep for 15 seconds (more aggressive than React's 2 mins but still light)
            sleep(Duration::from_secs(15)).await;
        }
    });

    Ok(())
}

const DB_NAME: &str = "sqlite:imarah.db";

async fn get_sqlite_pool(app: &AppHandle) -> Result<Pool<Sqlite>, String> {
    let db_instances = app.state::<DbInstances>();
    let instances = db_instances.0.read().await;
    let db_pool = instances.get(DB_NAME).ok_or("Database not found")?;
    
    match db_pool {
        DbPool::Sqlite(pool) => Ok(pool.clone()),
        #[allow(unreachable_patterns)]
        _ => Err("Database is not SQLite".to_string()),
    }
}

pub fn start_sync_worker(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            // Sleep at the beginning to allow app startup
            sleep(Duration::from_secs(10)).await;

            let pool_res = get_sqlite_pool(&app).await;
            if pool_res.is_err() {
                continue; // Db plugin not ready
            }
            let pool = pool_res.unwrap();

            // Fetch pending tasks
            let rows_res = sqlx::query("SELECT id, action, path, payload FROM offline_queue WHERE status = 'pending' ORDER BY created_at ASC")
                .fetch_all(&pool)
                .await;

            if let Ok(rows) = rows_res {
                if rows.is_empty() {
                    continue; // Nothing to sync
                }

                let net_state = app.state::<NetState>();
                let client = net_state.client.clone();
                let base_url = net_state.base_url.clone();
                let token = auth::get_token(&app);

                for row in rows {
                    let id: i32 = row.get("id");
                    let action: String = row.get("action");
                    let path: String = row.get("path");
                    let payload_str: Option<String> = row.get("payload");

                    // Mark as syncing
                    let _ = sqlx::query("UPDATE offline_queue SET status = 'syncing' WHERE id = $1")
                        .bind(id)
                        .execute(&pool)
                        .await;

                    let url = format!("{}{}", base_url, path);
                    let method = match action.to_uppercase().as_str() {
                        "POST" => reqwest::Method::POST,
                        "PUT" => reqwest::Method::PUT,
                        "DELETE" => reqwest::Method::DELETE,
                        _ => reqwest::Method::GET,
                    };

                    let mut builder = client.request(method, url);
                    if let Some(t) = &token {
                        builder = builder.bearer_auth(t);
                    }

                    if let Some(payload) = payload_str {
                        if !payload.is_empty() {
                            if let Ok(json_payload) = serde_json::from_str::<serde_json::Value>(&payload) {
                                builder = builder.json(&json_payload);
                            }
                        }
                    }

                    match builder.send().await {
                        Ok(res) => {
                            if res.status().is_success() {
                                // Delete from queue
                                let _ = sqlx::query("DELETE FROM offline_queue WHERE id = $1")
                                    .bind(id)
                                    .execute(&pool)
                                    .await;
                                let _ = app.emit("sync-status-changed", "success");
                            } else {
                                // Mark as failed (could be validation error, so we don't infinitely retry)
                                let err_msg = format!("HTTP {}", res.status());
                                let _ = sqlx::query("UPDATE offline_queue SET status = 'failed', error_message = $1 WHERE id = $2")
                                    .bind(err_msg)
                                    .bind(id)
                                    .execute(&pool)
                                    .await;
                                let _ = app.emit("sync-status-changed", "failed");
                            }
                        }
                        Err(e) => {
                            // Network error, likely still offline. Keep pending for next retry.
                            let _ = sqlx::query("UPDATE offline_queue SET status = 'pending', error_message = $1 WHERE id = $2")
                                .bind(e.to_string())
                                .bind(id)
                                .execute(&pool)
                                .await;
                        }
                    }
                }
            }
        }
    });
}

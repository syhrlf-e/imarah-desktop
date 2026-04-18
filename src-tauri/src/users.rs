use tauri::{AppHandle, State};
use crate::net::NetState;
use crate::auth::{self, User};
use tauri_plugin_sql::{DbInstances, DbPool};
use sqlx::{Row, Pool, Sqlite};
use tauri_plugin_store::StoreExt;

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
pub async fn list_users(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
) -> Result<Vec<User>, String> {
    // 1. Sync from Laravel
    let url = format!("{}/users", state.base_url);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    if let Ok(response) = builder.send().await {
        if response.status().is_success() {
            if let Ok(json_body) = response.json::<serde_json::Value>().await {
                let users_val = json_body.get("data").unwrap_or(&json_body);
                
                if let Ok(users) = serde_json::from_value::<Vec<User>>(users_val.clone()) {
                    // Update local SQLite cache
                    if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                        for user in &users {
                            let _ = sqlx::query("INSERT OR REPLACE INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)")
                                .bind(&user.id)
                                .bind(&user.name)
                                .bind(&user.email)
                                .bind(&user.role)
                                .execute(&pool)
                                .await;
                        }
                    }
                    return Ok(users);
                }
            }
        }
    }

    // 2. Fallback to SQLite
    let pool = get_sqlite_pool(&db_instances).await?;
    let rows = sqlx::query("SELECT id, name, email, role FROM users ORDER BY name ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut users = Vec::new();
    for row in rows {
        users.push(User {
            id: row.get("id"),
            name: row.get("name"),
            email: row.get("email"),
            role: row.get("role"),
        });
    }

    if users.is_empty() {
        return Err("Gagal memuat daftar pengguna (Offline & No Cache)".to_string());
    }

    Ok(users)
}

#[tauri::command]
pub async fn update_profile(
    app: AppHandle,
    state: State<'_, NetState>,
    db_instances: State<'_, DbInstances>,
    name: String,
    email: String,
) -> Result<User, String> {
    let store_path = "secure.bin";

    // 1. Update Laravel
    let url = format!("{}/profile", state.base_url);
    let mut builder = state.client.put(url).json(&serde_json::json!({
        "name": name,
        "email": email,
    }));

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    if status.is_success() {
        let user_data = json.get("data").and_then(|d| d.get("user")).or(json.get("data")).unwrap_or(&json);
        
        if let Ok(user) = serde_json::from_value::<User>(user_data.clone()) {
            // 2. Update Secure Store
            if let Ok(store) = app.store(store_path) {
                store.set("user", user_data.clone());
                let _ = store.save();
            }

            // 3. Update SQLite cache
            if let Ok(pool) = get_sqlite_pool(&db_instances).await {
                let _ = sqlx::query("INSERT OR REPLACE INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)")
                    .bind(&user.id)
                    .bind(&user.name)
                    .bind(&user.email)
                    .bind(&user.role)
                    .execute(&pool)
                    .await;
            }

            return Ok(user);
        }
    }

    Err(format!("Gagal update profil: {}", json))
}

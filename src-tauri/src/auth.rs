use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use serde_json::json;
use crate::net::NetState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthStatus {
    pub is_authenticated: bool,
    pub user: Option<User>,
}

const STORE_PATH: &str = "secure.bin";

#[tauri::command]
pub async fn set_auth_data(app: AppHandle, token: String, user: User) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    
    store.set("auth_token", json!(token));
    store.set("user", json!(user));
    
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_auth_status(
    app: AppHandle,
    state: tauri::State<'_, NetState>,
) -> Result<AuthStatus, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    
    let token_val = store.get("auth_token");
    if let Some(t) = token_val {
        if let Some(token) = t.as_str() {
            if token.is_empty() {
                return Ok(AuthStatus { is_authenticated: false, user: None });
            }

            // Fetch fresh profile from Laravel
            let url = format!("{}/profile", state.base_url);
            let response = state.client.get(url)
                .bearer_auth(token)
                .send()
                .await
                .map_err(|e| e.to_string())?;

            if response.status().is_success() {
                if let Ok(json_body) = response.json::<serde_json::Value>().await {
                    // Laravel response structure mapping
                    let user_data = json_body.get("data")
                        .and_then(|d| d.get("user"))
                        .or(json_body.get("data"))
                        .unwrap_or(&json_body);
                    
                    if let Ok(user) = serde_json::from_value::<User>(user_data.clone()) {
                        store.set("user", user_data.clone());
                        let _ = store.save();

                        return Ok(AuthStatus {
                            is_authenticated: true,
                            user: Some(user),
                        });
                    }
                }
            } else if response.status() == reqwest::StatusCode::UNAUTHORIZED {
                let _ = clear_auth_data(app).await;
            }
        }
    }
    
    Ok(AuthStatus {
        is_authenticated: false,
        user: None,
    })
}

#[tauri::command]
pub async fn clear_auth_data(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    
    store.delete("auth_token");
    store.delete("user");
    
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_auth_token(app: AppHandle) -> Result<Option<String>, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    Ok(store.get("auth_token").and_then(|v| v.as_str().map(|s| s.to_string())))
}

pub fn get_token(app: &AppHandle) -> Option<String> {
    if let Ok(store) = app.store(STORE_PATH) {
        return store.get("auth_token").and_then(|v| v.as_str().map(|s| s.to_string()));
    }
    None
}

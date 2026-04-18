use reqwest::{Client, Method};
use serde::Deserialize;
use serde_json::Value;
use tauri::{AppHandle, State};
use crate::auth;

pub struct NetState {
    pub client: Client,
    pub base_url: String,
}

#[derive(Debug, Deserialize)]
pub struct ApiRequest {
    pub method: String,
    pub path: String,
    pub body: Option<Value>,
}

#[tauri::command]
pub async fn api_request(
    app: AppHandle,
    state: State<'_, NetState>,
    request: ApiRequest,
) -> Result<Value, String> {
    let method = match request.method.to_uppercase().as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        "PUT" => Method::PUT,
        "DELETE" => Method::DELETE,
        _ => return Err("Invalid HTTP method".to_string()),
    };

    let url = format!("{}{}", state.base_url, request.path);
    let mut builder = state.client.request(method, url);

    // Add Auth token if available
    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    // Add body if present
    if let Some(body) = request.body {
        builder = builder.json(&body);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    
    // Handle 401 Unauthorized
    if response.status() == reqwest::StatusCode::UNAUTHORIZED {
        // Clear auth data in Rust
        let _ = auth::clear_auth_data(app).await;
        return Err("Unauthorized".to_string());
    }

    let status = response.status();
    let text = response.text().await.map_err(|e| e.to_string())?;

    let json: Value = serde_json::from_str(&text).unwrap_or(Value::String(text));

    if !status.is_success() {
        return Err(format!("API Error ({}): {}", status, json));
    }

    Ok(json)
}

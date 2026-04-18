pub mod auth;
pub mod net;
pub mod db;
pub mod export;
pub mod events;
pub mod settings;
pub mod users;
pub mod agenda;
pub mod inventaris;
pub mod kas;
pub mod zakat;

use reqwest::Client;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv(); // Load .env
    let base_url = std::env::var("VITE_API_URL").unwrap_or_else(|_| "http://imarah-backend.test/api".to_string());
    
    let migrations = db::get_migrations();
    
    tauri::Builder::default()
        .manage(net::NetState {
            client: Client::new(),
            base_url,
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:imarah.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let window_clone = window.clone();
                let app_handle = window.app_handle();
                
                // We prevent immediate close to perform cleanup
                api.prevent_close();
                
                let app_handle_clone = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    // 1. Call logout API if token exists
                    if let Some(token) = auth::get_token(&app_handle_clone) {
                        if let Some(state) = app_handle_clone.try_state::<net::NetState>() {
                            let url = format!("{}/auth/logout", state.base_url);
                            let _ = state.client.post(url).bearer_auth(token).send().await;
                        }
                    }
                    
                    // 2. Clear local auth store
                    let _ = auth::clear_auth_data(app_handle_clone).await;
                    
                    // 3. Finally destroy the window
                    let _ = window_clone.destroy();
                });
            }
        })
        .setup(|app| {
            events::start_sync_worker(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            auth::set_auth_data,
            auth::get_auth_status,
            auth::clear_auth_data,
            auth::get_auth_token,
            net::api_request,
            export::export_laporan,
            events::start_challenge_listener,
            events::start_app_pulse,
            settings::get_settings,
            settings::update_settings,
            users::list_users,
            users::update_profile,
            agenda::list_agenda,
            agenda::create_agenda,
            agenda::update_agenda,
            agenda::delete_agenda,
            inventaris::list_inventaris,
            inventaris::create_inventaris,
            inventaris::update_inventaris,
            inventaris::delete_inventaris,
            kas::get_kas_summary,
            kas::list_kas_transactions,
            kas::create_kas_transaction,
            kas::verify_kas_transaction,
            kas::delete_kas_transaction,
            zakat::list_muzakki,
            zakat::create_muzakki,
            zakat::update_muzakki,
            zakat::delete_muzakki,
            zakat::import_muzakki,
            zakat::list_mustahiq,
            zakat::create_mustahiq,
            zakat::update_mustahiq,
            zakat::delete_mustahiq,
            zakat::import_mustahiq,
            zakat::list_zakat_receipts,
            zakat::create_zakat_receipt,
            zakat::delete_zakat_receipt,
            zakat::list_zakat_distributions,
            zakat::create_zakat_distribution,
            zakat::delete_zakat_distribution,
            zakat::calculate_zakat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

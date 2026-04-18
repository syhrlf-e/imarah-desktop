use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use std::fs::File;
use std::io::Write;
use crate::auth;
use crate::net::NetState;

#[tauri::command]
pub async fn export_laporan(
    app: AppHandle,
    state: State<'_, NetState>,
    month: String,
    year: String,
) -> Result<String, String> {
    // 1. Fetch from Laravel
    let url = format!("{}/laporan/export?month={}&year={}", state.base_url, month, year);
    let mut builder = state.client.get(url);

    if let Some(token) = auth::get_token(&app) {
        builder = builder.bearer_auth(token);
    }

    let response = builder.send().await.map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("Gagal fetch laporan: {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    // 2. Open Save Dialog
    let file_name = format!("Laporan_{}_{}.xlsx", month, year);
    let save_path = app
        .dialog()
        .file()
        .set_file_name(&file_name)
        .add_filter("Excel", &["xlsx"])
        .blocking_save_file();

    if let Some(path) = save_path {
        // 3. Write to selected path
        let path_str = path.to_string();
        let mut file = File::create(&path_str).map_err(|e| e.to_string())?;
        file.write_all(&bytes).map_err(|e| e.to_string())?;
        
        Ok(path_str)
    } else {
        Err("Export dibatalkan".to_string())
    }
}

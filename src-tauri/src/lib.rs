use log::{info, warn};
use std::fs;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent, WindowEvent,
};

/// Marker file name for permission reset
const RESET_MARKER_FILE: &str = ".reset_permissions";

/// App identifier from tauri.conf.json (embedded at compile time)
fn get_app_identifier() -> String {
    const CONFIG: &str = include_str!("../tauri.conf.json");
    let json: serde_json::Value = serde_json::from_str(CONFIG)
        .expect("tauri.conf.json is invalid JSON");
    json["identifier"]
        .as_str()
        .expect("tauri.conf.json missing 'identifier' field")
        .to_string()
}

/// Get the WebView data folder name for the current platform
fn get_webview_folder_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "EBWebView" // WebView2
    }
    #[cfg(target_os = "linux")]
    {
        "WebKit" // WebKitGTK
    }
    #[cfg(target_os = "macos")]
    {
        "WebKit" // WKWebView
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        "WebKit" // Fallback
    }
}

/// Check for permission reset marker BEFORE Tauri initializes WebView
/// This must run before any Tauri code to ensure WebView folder is not locked
fn check_and_reset_permissions_early() {
    // Get LOCAL data directory (where WebView stores its data)
    let Some(data_dir) = dirs::data_local_dir() else {
        warn!("Could not determine local data directory");
        return;
    };

    // Construct app data path (matches Tauri's app_local_data_dir resolution)
    let app_data_dir = data_dir.join(get_app_identifier());
    let marker_path = app_data_dir.join(RESET_MARKER_FILE);

    if !marker_path.exists() {
        return;
    }

    info!("Permission reset marker found at {:?}", marker_path);

    // Delete WebView data directory (not locked because this runs before Tauri init)
    let webview_dir = app_data_dir.join(get_webview_folder_name());
    if webview_dir.exists() {
        match fs::remove_dir_all(&webview_dir) {
            Ok(_) => info!("Successfully deleted WebView data at {:?}", webview_dir),
            Err(e) => warn!("Failed to delete WebView data: {}", e),
        }
    }

    // Remove the marker file
    match fs::remove_file(&marker_path) {
        Ok(_) => info!("Removed permission reset marker"),
        Err(e) => warn!("Failed to remove marker file: {}", e),
    }

    info!("Permission reset complete");
}

/// Request WebView permission reset - creates a marker file and closes the app
/// The actual reset happens on next startup before WebView initializes
#[tauri::command]
async fn reset_webview_permissions(app: AppHandle) -> Result<(), String> {
    // Use LOCAL data dir (where WebView stores its data)
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app local data dir: {}", e))?;

    // Ensure directory exists
    let _ = fs::create_dir_all(&app_data_dir);

    // Create marker file to signal permission reset on next startup
    let marker_path = app_data_dir.join(RESET_MARKER_FILE);
    match fs::write(&marker_path, "reset") {
        Ok(_) => info!("Created permission reset marker at {:?}", marker_path),
        Err(e) => warn!("Failed to create marker (will still close): {}", e),
    }

    info!("Closing application - permissions will be reset on next startup...");
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Starting Secludia application");

    // IMPORTANT: Check for permission reset BEFORE Tauri initializes WebView
    // This ensures the EBWebView folder is not locked when we try to delete it
    check_and_reset_permissions_early();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![reset_webview_permissions])
        .setup(|app| {
            // Create tray menu with just "Quit"
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;

            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|_app, event| {
                    if event.id.as_ref() == "quit" {
                        info!("Quit requested from tray");
                        std::process::exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            info!("System tray initialized");
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } => {
            // Prevent window from closing, hide it instead
            api.prevent_close();
            if let Some(window) = app_handle.get_webview_window(&label) {
                let _ = window.hide();
                info!("Window hidden to tray");
            }
        }
        RunEvent::ExitRequested { api, .. } => {
            // Keep running even if all windows are closed
            api.prevent_exit();
        }
        _ => {}
    });
}

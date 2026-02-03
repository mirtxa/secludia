use log::{info, warn};
use std::fs;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::PageLoadEvent,
    AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

/// Marker file name for permission reset
const RESET_MARKER_FILE: &str = ".reset_permissions";

/// OAuth redirect URI prefix (navigation intercepted before load)
const OAUTH_REDIRECT_PREFIX: &str = "http://localhost/oauth/callback";

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

/// State for OAuth window result communication
struct OAuthState {
    /// Result of the OAuth flow (URL with code, or error message)
    result: Mutex<Option<Result<String, String>>>,
}

/// Open an OAuth authentication window that intercepts the redirect callback.
/// Returns the full callback URL (with code and state) on success.
#[tauri::command]
async fn open_oauth_window(app: AppHandle, url: String) -> Result<String, String> {
    info!("Opening OAuth window for URL: {}", url);

    // Parse and validate URL
    let parsed_url: url::Url = url.parse().map_err(|e| format!("Invalid URL: {}", e))?;

    // Security: Only allow https:// URLs (or http://localhost for development)
    match parsed_url.scheme() {
        "https" => {}
        "http" if parsed_url.host_str() == Some("localhost") => {}
        _ => return Err("OAuth URL must use HTTPS".to_string()),
    }

    // Create state for communication between window event and command
    let oauth_state = std::sync::Arc::new(OAuthState {
        result: Mutex::new(None),
    });
    let state_for_handler = oauth_state.clone();

    // Create the OAuth window
    let oauth_window = WebviewWindowBuilder::new(
        &app,
        "oauth",
        WebviewUrl::External(parsed_url),
    )
    .title("Sign in")
    .inner_size(500.0, 700.0)
    .center()
    .resizable(true)
    .on_page_load(move |window, payload| {
        // Intercept navigation to the redirect URI
        if let PageLoadEvent::Started = payload.event() {
            let url = payload.url().to_string();
            info!("OAuth window navigating to: {}", url);

            if url.starts_with(OAUTH_REDIRECT_PREFIX) {
                info!("OAuth callback intercepted");

                // Store the result
                if let Ok(mut result) = state_for_handler.result.lock() {
                    *result = Some(Ok(url));
                }

                // Close the window
                let _ = window.close();
            }
        }
    })
    .build()
    .map_err(|e| format!("Failed to create OAuth window: {}", e))?;

    // Listen for window close event
    let state_for_close = oauth_state.clone();
    let _close_handler = oauth_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } | WindowEvent::Destroyed = event {
            // If window is closed without a result, set error
            if let Ok(mut result) = state_for_close.result.lock() {
                if result.is_none() {
                    *result = Some(Err("OAUTH_CANCELLED".to_string()));
                }
            }
        }
    });

    // Wait for result with timeout
    let timeout = std::time::Duration::from_secs(300); // 5 minute timeout
    let start = std::time::Instant::now();

    loop {
        // Check if we have a result
        if let Ok(result) = oauth_state.result.lock() {
            if let Some(ref r) = *result {
                return r.clone();
            }
        }

        // Check timeout
        if start.elapsed() > timeout {
            // Close window if still open
            if let Some(w) = app.get_webview_window("oauth") {
                let _ = w.close();
            }
            return Err("OAUTH_TIMEOUT".to_string());
        }

        // Small delay to avoid busy waiting
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
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
        .plugin(tauri_plugin_stronghold::Builder::new(|password| {
            // Derive key from password using argon2
            use argon2::{Argon2, password_hash::SaltString, PasswordHasher};

            // Use a fixed salt for deterministic key derivation
            // This is acceptable since the password is used as a key derivation input
            let salt = SaltString::encode_b64(b"secludia-stronghold").expect("Invalid salt");
            let argon2 = Argon2::default();

            let hash = argon2
                .hash_password(password.as_bytes(), &salt)
                .expect("Failed to hash password");

            // Extract the hash output (32 bytes)
            hash.hash
                .expect("Hash output missing")
                .as_bytes()
                .to_vec()
        }).build())
        .invoke_handler(tauri::generate_handler![
            reset_webview_permissions,
            open_oauth_window
        ])
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
            // Only hide to tray for the main window, not OAuth windows
            if label == "main" {
                api.prevent_close();
                if let Some(window) = app_handle.get_webview_window(&label) {
                    let _ = window.hide();
                    info!("Window hidden to tray");
                }
            }
        }
        RunEvent::ExitRequested { api, .. } => {
            // Keep running even if all windows are closed
            api.prevent_exit();
        }
        _ => {}
    });
}

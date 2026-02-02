use log::info;
use std::fs;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent, WindowEvent,
};

/// Reset WebView2 permissions by deleting the EBWebView folder and restarting the app
#[tauri::command]
async fn reset_webview_permissions(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let webview_dir = app_data_dir.join("EBWebView");

    if webview_dir.exists() {
        info!("Deleting WebView2 data at {:?}", webview_dir);
        fs::remove_dir_all(&webview_dir)
            .map_err(|e| format!("Failed to delete WebView2 data: {}", e))?;
    }

    info!("Exiting application for permission reset...");
    // Use process::exit to bypass the ExitRequested handler that prevents exit
    std::process::exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    info!("Starting Secludia application");

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

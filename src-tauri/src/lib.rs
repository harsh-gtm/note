use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use tauri::Manager;

struct DbState(Pool<Sqlite>);

#[derive(serde::Serialize, sqlx::FromRow)]
struct Notebook {
    id: i64,
    name: String,
}

#[derive(serde::Serialize, sqlx::FromRow)]
struct Note {
    id: i64,
    notebook_id: i64,
    title: String,
    position: i64,
}

#[derive(serde::Serialize, sqlx::FromRow)]
struct Page {
    id: i64,
    note_id: i64,
    title: String,
    content: String,
    position: i64,
}

#[derive(serde::Serialize)]
struct LastSession {
    notebook: Notebook,
    note: Note,
    page: Page,
}

// --- Notebooks ---

#[tauri::command]
async fn get_notebooks(state: tauri::State<'_, DbState>) -> Result<Vec<Notebook>, String> {
    sqlx::query_as::<_, Notebook>("SELECT id, name FROM notebooks ORDER BY created_at ASC")
        .fetch_all(&state.0)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_notebook(
    state: tauri::State<'_, DbState>,
    name: String,
) -> Result<Notebook, String> {
    let id = sqlx::query("INSERT INTO notebooks (name) VALUES (?)")
        .bind(&name)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?
        .last_insert_rowid();

    Ok(Notebook { id, name })
}

#[tauri::command]
async fn delete_notebook(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM notebooks WHERE id = ?")
        .bind(id)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Notes ---

#[tauri::command]
async fn get_notes(
    state: tauri::State<'_, DbState>,
    notebook_id: i64,
) -> Result<Vec<Note>, String> {
    sqlx::query_as::<_, Note>(
        "SELECT id, notebook_id, title, position FROM notes WHERE notebook_id = ? ORDER BY position ASC"
    )
    .bind(notebook_id)
    .fetch_all(&state.0)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_note(
    state: tauri::State<'_, DbState>,
    notebook_id: i64,
    title: String,
) -> Result<Note, String> {
    // get next position
    let position: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(position) + 1, 0) FROM notes WHERE notebook_id = ?",
    )
    .bind(notebook_id)
    .fetch_one(&state.0)
    .await
    .map_err(|e| e.to_string())?;

    let id = sqlx::query("INSERT INTO notes (notebook_id, title, position) VALUES (?, ?, ?)")
        .bind(notebook_id)
        .bind(&title)
        .bind(position)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?
        .last_insert_rowid();

    // seed a first page automatically
    sqlx::query(
        "INSERT INTO pages (note_id, title, content, position) VALUES (?, 'Page 1', '', 0)",
    )
    .bind(id)
    .execute(&state.0)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Note {
        id,
        notebook_id,
        title,
        position,
    })
}

#[tauri::command]
async fn delete_note(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM notes WHERE id = ?")
        .bind(id)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn rename_note(
    state: tauri::State<'_, DbState>,
    id: i64,
    title: String,
) -> Result<(), String> {
    sqlx::query("UPDATE notes SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(title)
        .bind(id)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- Pages ---

#[tauri::command]
async fn get_pages(state: tauri::State<'_, DbState>, note_id: i64) -> Result<Vec<Page>, String> {
    sqlx::query_as::<_, Page>(
        "SELECT id, note_id, title, content, position FROM pages WHERE note_id = ? ORDER BY position ASC"
    )
    .bind(note_id)
    .fetch_all(&state.0)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_page(state: tauri::State<'_, DbState>, id: i64) -> Result<Page, String> {
    sqlx::query_as::<_, Page>(
        "SELECT id, note_id, title, content, position FROM pages WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&state.0)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_page(
    state: tauri::State<'_, DbState>,
    id: i64,
    content: String,
    title: String,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE pages SET content = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(content)
    .bind(title)
    .bind(id)
    .execute(&state.0)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn create_page(
    state: tauri::State<'_, DbState>,
    note_id: i64,
    title: String,
) -> Result<Page, String> {
    let position: i64 =
        sqlx::query_scalar("SELECT COALESCE(MAX(position) + 1, 0) FROM pages WHERE note_id = ?")
            .bind(note_id)
            .fetch_one(&state.0)
            .await
            .map_err(|e| e.to_string())?;

    let id =
        sqlx::query("INSERT INTO pages (note_id, title, content, position) VALUES (?, ?, '', ?)")
            .bind(note_id)
            .bind(&title)
            .bind(position)
            .execute(&state.0)
            .await
            .map_err(|e| e.to_string())?
            .last_insert_rowid();

    Ok(Page {
        id,
        note_id,
        title,
        content: String::new(),
        position,
    })
}

#[tauri::command]
async fn delete_page(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM pages WHERE id = ?")
        .bind(id)
        .execute(&state.0)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_last_session(state: tauri::State<'_, DbState>) -> Result<LastSession, String> {
    // get the most recently updated page and join up the tree
    let page = sqlx::query_as::<_, Page>(
        "SELECT id, note_id, title, content, position FROM pages ORDER BY updated_at DESC LIMIT 1",
    )
    .fetch_one(&state.0)
    .await
    .map_err(|e| e.to_string())?;

    let note = sqlx::query_as::<_, Note>(
        "SELECT id, notebook_id, title, position FROM notes WHERE id = ?",
    )
    .bind(page.note_id)
    .fetch_one(&state.0)
    .await
    .map_err(|e| e.to_string())?;

    let notebook = sqlx::query_as::<_, Notebook>("SELECT id, name FROM notebooks WHERE id = ?")
        .bind(note.notebook_id)
        .fetch_one(&state.0)
        .await
        .map_err(|e| e.to_string())?;

    Ok(LastSession {
        notebook,
        note,
        page,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("Failed to get data dir");
            std::fs::create_dir_all(&app_dir)?;

            let db_path = app_dir.join("notes.db");
            let db_url = format!("sqlite://{}?mode=rwc", db_path.to_str().unwrap());

            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePoolOptions::new()
                    .connect(&db_url)
                    .await
                    .expect("Failed to connect to DB");

                sqlx::query("PRAGMA journal_mode = WAL;")
                    .execute(&pool)
                    .await
                    .unwrap();

                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .expect("Migration failed");

                sqlx::query("INSERT OR IGNORE INTO notebooks (id, name) VALUES (1, 'My Notebook')")
                    .execute(&pool)
                    .await
                    .unwrap();

                sqlx::query("INSERT OR IGNORE INTO notes (id, notebook_id, title, position) VALUES (1, 1, 'My Note', 0)")
                    .execute(&pool)
                    .await
                    .unwrap();

                sqlx::query("INSERT OR IGNORE INTO pages (id, note_id, title, content, position) VALUES (1, 1, 'Page 1', '', 0)")
                    .execute(&pool)
                    .await
                    .unwrap();

                println!("Database initialized successfully.");
                pool
            });

            app.manage(DbState(pool));

            if let Some(window) = app.get_webview_window("main") {
                window.set_focus()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_notebooks,
            create_notebook,
            delete_notebook,
            get_notes,
            create_note,
            delete_note,
            rename_note,
            get_pages,
            get_page,
            save_page,
            create_page,
            delete_page,
            get_last_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

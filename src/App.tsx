import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Editor } from "./components/editor/editor";
import { TitleBar } from "./components/titlebar";

interface Notebook {
  id: number;
  name: string;
}

interface Note {
  id: number;
  notebook_id: number;
  title: string;
  position: number;
}

interface Page {
  id: number;
  noteId: number;
  title: string;
  content: string;
  position: number;
}

interface LastSession {
  notebook: Notebook;
  note: Note;
  page: Page;
}

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [title, setTitle] = useState("Untitled");
  const [session, setSession] = useState<LastSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    invoke<LastSession>("get_last_session")
      .then((data) => {
        setSession(data);
        setTitle(data.page.title);
        setReady(true);
      })
      .catch((err) => {
        console.error("Failed to load session:", err);
        setReady(true);
      });
  }, []);

  return (
    <div
      className="bg-(--background) rounded-xl border border-(--border)"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TitleBar isHovered={isHovered} title={title} />
      <main className="flex-1 overflow-y-hidden">
        {ready && session && (
          <Editor
            isHovered={isHovered}
            onTitleChange={setTitle}
            notebook={session.notebook}
            note={session.note}
            initialPage={session.page}
          />
        )}
      </main>
    </div>
  );
}

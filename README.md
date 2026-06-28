# Note
*Minimalist note taking for the focused people.*


<img width="2880" height="1746" alt="Note" src="https://github.com/user-attachments/assets/93918ee1-fe28-408d-a037-7bd624d857f8" />

Jot is a "stay-on-top" note taking application designed to remove the friction between a thought and going to the process of finding where and how to save it to a note. By adopting a "headless-first" approach to UI, the app stays out of your way while you work, surfacing only when you need it and receding into a minimal footprint when you're done.

### Technical
I built this tool to solve the bloat0ware problem in the current note taking market. Every feature is intentionally chosen for performance and utility:
*   **Editor Core:** Powered by **Tiptap**, providing a lightweight, extensible foundation (includes support for images, tables, block-quotes, etc.).
*   **Performance-First Storage:** Built on **SQLite and SQLx**, ensuring that even with a large library of notes, the app remains instantaneous.
*   **Workflow Integration:** Designed to float over active workspaces, allowing for capture without context switching.

### Current State
*   **Tabbed Interface:** Advanced note management through an implemented multi tab architecture.
*   **Minimalist UI:** Intelligent toolbar visibility that vanishes upon focus loss to maintain a clean workspace.

### Future Roadmap
*   **Command Palette:** Implementing a Raycast-inspired interface for rapid navigation and action execution.
*   **Graphical Knowledge Graph:** Visualizing the relationship between notes to transform individual entries into a connected second brain.
*   **Note Hierarchy:** Expanding beyond the current scope to handle separate, linked documents.

### Why I Built This
Modern note apps are often too heavy, forcing users to build their workflow *around* the app rather than the other way around. Jot is my interpertation of a fast, offline first, and capable of handling rich media without the performance overhead of Electron heavy competitors.

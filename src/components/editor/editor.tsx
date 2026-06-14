"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { invoke } from "@tauri-apps/api/core";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";

// --- UI Primitives ---
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap/tiptap-ui/mark-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/editor/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "./editor.scss";
import TextAlignDropdownMenu from "@/components/tiptap/tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { Sidebar } from "../sidebar/sidebar";

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

interface EditorProps {
  isHovered: boolean;
  onTitleChange: (newTitle: string) => void;
  notebook: Notebook;
  note: Note;
  initialPage: Page;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <ToolbarSeparator />
        <CodeBlockButton />
        <MarkButton type="code" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="underline" />
        <MarkButton type="strike" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignDropdownMenu modal={false} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator />}
      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function Editor({
  isHovered,
  onTitleChange,
  notebook,
  note,
  initialPage,
}: EditorProps) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  // --- Page state ---
  const [pages, setPages] = useState<Page[]>([initialPage]);
  const [activePage, setActivePage] = useState<Page>(initialPage);
  const [content, setContent] = useState(initialPage.content);
  const [pageTitle, setPageTitle] = useState(initialPage.title);

  const activePageRef = useRef<Page>(initialPage);
  const contentRef = useRef(initialPage.content);
  const pageTitleRef = useRef(initialPage.title);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: { openOnClick: false, enableClickSelection: true },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: activePage.content,
    onUpdate: ({ editor }) => {
      if (isSwitchingPage.current) return;

      const firstLine = editor.state.doc.firstChild?.textContent || "Untitled";
      const html = editor.getHTML();

      onTitleChange(firstLine);
      setPageTitle(firstLine);
      setContent(html);
      contentRef.current = html; // ← keep ref in sync
      pageTitleRef.current = firstLine; // ← keep ref in sync

      const currentId = activePageRef.current.id;
      setPages((prev) =>
        prev.map((p) => (p.id === currentId ? { ...p, title: firstLine } : p)),
      );
    },
  });

  // Load all pages for this note on mount
  useEffect(() => {
    const loadPages = async () => {
      try {
        const data = await invoke<Page[]>("get_pages", {
          noteId: note.id,
        });

        setPages(data);

        if (data.length > 0) {
          setActivePage(data[0]);
          setPageTitle(data[0].title);
          setContent(data[0].content);

          editor?.commands.setContent(data[0].content);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadPages();
  }, [note.id, editor]);

  const isSwitchingPage = useRef(false);

  // When switching pages, save current and load new
  const switchPage = async (page: Page) => {
    if (page.id === activePage.id) return;

    // Save current page using editor directly
    const currentContent = editor?.getHTML() ?? "";
    const currentTitle =
      editor?.state.doc.firstChild?.textContent || "Untitled";

    await invoke("save_page", {
      id: activePage.id,
      content: currentContent,
      title: currentTitle,
    });

    // Load fresh from DB instead of stale pages array
    const freshPage = await invoke<Page>("get_page", { id: page.id });

    isSwitchingPage.current = true;
    activePageRef.current = freshPage;

    setActivePage(freshPage);
    setContent(freshPage.content);
    setPageTitle(freshPage.title);
    contentRef.current = freshPage.content;
    pageTitleRef.current = freshPage.title;
    editor?.commands.setContent(freshPage.content);
    onTitleChange(freshPage.title);

    isSwitchingPage.current = false;
  };

  const addPage = async () => {
    const newPage = await invoke<Page>("create_page", {
      noteId: note.id,
      title: `Page ${pages.length + 1}`,
    });
    setPages((prev) => [...prev, newPage]);
    switchPage(newPage);
  };

  // debounced save
  useEffect(() => {
    if (!editor) return;
    const handler = setTimeout(() => {
      invoke("save_page", {
        id: activePageRef.current.id,
        content: contentRef.current,
        title: pageTitleRef.current,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [content, pageTitle]);

  // save on unmount — fires when component is destroyed
  useEffect(() => {
    return () => {
      invoke("save_page", {
        id: activePageRef.current.id,
        content: contentRef.current,
        title: pageTitleRef.current,
      });
    };
  }, []);

  // save on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      invoke("save_page", {
        id: activePageRef.current.id,
        content: contentRef.current,
        title: pageTitleRef.current,
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (editor) editor.commands.focus("start");
  }, [editor]);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") setMobileView("main");
  }, [isMobile, mobileView]);

  // Page tab keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "]") {
        const idx = pages.findIndex((p) => p.id === activePage.id);
        if (idx < pages.length - 1) switchPage(pages[idx + 1]);
      }
      if (e.metaKey && e.shiftKey && e.key === "[") {
        const idx = pages.findIndex((p) => p.id === activePage.id);
        if (idx > 0) switchPage(pages[idx - 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages, activePage]);

  return (
    <div className="simple-editor-wrapper">
      <Sidebar
        onClick={addPage}
        pages={pages}
        activePageId={activePage.id}
        onSelectPage={(id) => {
          const page = pages.find((p) => p.id === id);
          if (page) switchPage(page);
        }}
        onDeletePage={async (id) => {
          await invoke("delete_page", { id });
          setPages((prev) => prev.filter((p) => p.id !== id));
          // if deleted page was active, switch to first remaining
          if (id === activePage.id) {
            const remaining = pages.filter((p) => p.id !== id);
            if (remaining.length > 0) switchPage(remaining[0]);
          }
        }}
        onRenamePage={(id) => {
          const name = prompt(
            "Rename page:",
            pages.find((p) => p.id === id)?.title,
          );
          if (name) {
            invoke("save_page", {
              id,
              content:
                id === activePage.id
                  ? contentRef.current
                  : (pages.find((p) => p.id === id)?.content ?? ""),
              title: name,
            });
            setPages((prev) =>
              prev.map((p) => (p.id === id ? { ...p, title: name } : p)),
            );
            if (id === activePage.id) {
              pageTitleRef.current = name;
              setPageTitle(name);
              onTitleChange(name);
            }
          }
        }}
      />

      <EditorContext.Provider value={{ editor }}>
        <Toolbar ref={toolbarRef}>
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div style={{ paddingLeft: "48px" }}>
          <EditorContent editor={editor} className="simple-editor-content" />
        </div>
      </EditorContext.Provider>
    </div>
  );
}

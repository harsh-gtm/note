"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

export type TextAlignment = "left" | "center" | "right" | "justify";

export interface UseTextAlignDropdownMenuConfig {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
}

export function getActiveAlignment(editor: Editor | null): TextAlignment {
  if (!editor || !editor.isEditable) {
    return "left";
  }

  if (
    editor.isActive({
      textAlign: "center",
    })
  ) {
    return "center";
  }

  if (
    editor.isActive({
      textAlign: "right",
    })
  ) {
    return "right";
  }

  if (
    editor.isActive({
      textAlign: "justify",
    })
  ) {
    return "justify";
  }

  return "left";
}

export function useTextAlignDropdownMenu(
  config?: UseTextAlignDropdownMenuConfig,
) {
  const { editor: providedEditor, hideWhenUnavailable = false } = config || {};

  const { editor } = useTiptapEditor(providedEditor);

  const [isVisible, setIsVisible] = useState(true);

  const activeAlignment = getActiveAlignment(editor);

  const isActive = activeAlignment !== "left";

  const canToggle = !!editor && editor.isEditable;

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(hideWhenUnavailable ? editor.isEditable : true);
    };

    handleSelectionUpdate();

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  const icons = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
    justify: AlignJustify,
  };

  return {
    isVisible,
    isActive,
    canToggle,
    activeAlignment,
    label: "Alignment",
    Icon: icons[activeAlignment],
  };
}

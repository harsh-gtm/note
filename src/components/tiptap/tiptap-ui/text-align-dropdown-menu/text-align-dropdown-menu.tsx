"use client";

import { forwardRef, useCallback, useState } from "react";

import { ChevronDownIcon } from "@/components/tiptap/tiptap-icons/chevron-down-icon";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

import {
  useTextAlignDropdownMenu,
  type UseTextAlignDropdownMenuConfig,
} from "./use-text-align-dropdown-menu";

import type { ButtonProps } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap/tiptap-ui-primitive/dropdown-menu";

import { TextAlignButton } from "../text-align-button";

export interface TextAlignDropdownMenuProps
  extends Omit<ButtonProps, "type">, UseTextAlignDropdownMenuConfig {
  onOpenChange?: (isOpen: boolean) => void;
  modal?: boolean;
}

export const TextAlignDropdownMenu = forwardRef<
  HTMLButtonElement,
  TextAlignDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onOpenChange,
      children,
      modal = true,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);

    const [isOpen, setIsOpen] = useState(false);

    const { isVisible, isActive, canToggle, Icon } = useTextAlignDropdownMenu({
      editor,
      hideWhenUnavailable,
    });

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!editor || !canToggle) return;

        setIsOpen(open);
        onOpenChange?.(open);
      },
      [editor, canToggle, onOpenChange],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            data-active-state={isActive ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canToggle}
            data-disabled={!canToggle}
            aria-label="Text alignment"
            aria-pressed={isActive}
            {...buttonProps}
            ref={ref}
          >
            {children ? (
              children
            ) : (
              <>
                <Icon className="tiptap-button-icon" />
                <ChevronDownIcon className="tiptap-button-dropdown-small" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <TextAlignButton
                editor={editor}
                align="left"
                text="Left"
                showTooltip={false}
              />
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <TextAlignButton
                editor={editor}
                align="center"
                text="Center"
                showTooltip={false}
              />
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <TextAlignButton
                editor={editor}
                align="right"
                text="Right"
                showTooltip={false}
              />
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <TextAlignButton
                editor={editor}
                align="justify"
                text="Justify"
                showTooltip={false}
              />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

TextAlignDropdownMenu.displayName = "TextAlignDropdownMenu";

export default TextAlignDropdownMenu;

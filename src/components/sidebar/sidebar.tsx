"use client";

import { useState, useRef } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Sidebar = ({
  onClick,
  pages,
  activePageId,
  onSelectPage,
  onDeletePage,
  onRenamePage,
}: {
  onClick: () => void;
  pages: any[];
  activePageId: number;
  onSelectPage: (id: number) => void;
  onDeletePage?: (id: number) => void;
  onRenamePage?: (id: number, newName: string) => void;
}) => {
  const [showIcon, setShowIcon] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  const handleOpenDialog = (page: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPageId(page.id);
    setRenameValue(page.title);
    setDialogOpen(true);
  };

  const handleRename = () => {
    if (selectedPageId !== null && renameValue.trim()) {
      onRenamePage?.(selectedPageId, renameValue.trim());
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedPageId !== null) {
      onDeletePage?.(selectedPageId);
    }
    setDialogOpen(false);
  };

  return (
    <div
      className="fixed right-0 h-full z-50 flex items-center justify-end"
      onMouseEnter={() => setShowIcon(true)}
      onMouseLeave={() => {
        setShowIcon(false);
        setShowContent(false);
      }}
    >
      <div className="absolute right-0 top-[75px] bottom-0 w-[15px]" />

      <Dialog
        open={dialogOpen}
        onOpenChange={({ open }) => setDialogOpen(open)}
        initialFocusEl={() => inputRef.current}
      >
        <DialogContent>
          <DialogBody>
            <FieldGroup>
              <Field>
                <FieldLabel>Edit Page Title:</FieldLabel>
                <Input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  placeholder="Page name"
                />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 mr-auto"
            >
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={handleRename}>Save</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>

        <motion.div
          className="relative mr-4 flex flex-col items-end"
          animate={{ opacity: showIcon ? 1 : 0 }}
          style={{ pointerEvents: showIcon ? "auto" : "none" }}
          onMouseEnter={() => setShowContent(true)}
          onMouseLeave={() => setShowContent(false)}
        >
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 pb-4"
              >
                <Tabs
                  value={activePageId.toString()}
                  onValueChange={(details) =>
                    onSelectPage(Number(details.value))
                  }
                  orientation="vertical"
                >
                  <TabsList className="flex flex-col items-end gap-1 bg-transparent p-0">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="relative flex items-center group"
                      >
                        <TabsTrigger
                          value={page.id.toString()}
                          className="relative flex items-center w-[50px] px-2 py-1 overflow-hidden text-gray-400 hover:text-white"
                        >
                          <span
                            className={`
                              absolute left-0 top-[6px] bottom-[6px]
                              w-[2px] bg-white rounded transition-opacity
                              ${activePageId === page.id ? "opacity-100" : "opacity-0"}
                            `}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block w-[80px] truncate">
                              {page.title}
                            </span>
                          </span>
                        </TabsTrigger>

                        <DialogTrigger asChild>
                          <button
                            className="
                              absolute -right-1
                              opacity-0 group-hover:opacity-100
                              transition-opacity
                              text-gray-400 hover:text-white
                              p-0.5 rounded
                            "
                            onClick={(e) => handleOpenDialog(page, e)}
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </DialogTrigger>
                      </div>
                    ))}
                  </TabsList>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add page button */}
          <div
            className="flex items-center p-2 text-gray-400 hover:text-white transition-colors bg-background/50 rounded-full cursor-pointer"
            onClick={onClick}
          >
            <Plus size={17} />
            <AnimatePresence>
              {showContent && (
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                  exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                  className="whitespace-nowrap overflow-hidden text-[12px] font-medium"
                >
                  Add new page
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
};

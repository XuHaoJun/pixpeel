"use client";

import { useCallback, useEffect } from "react";
import { useStore } from "zustand";
import { Crop, Maximize2, Undo2, Redo2 } from "lucide-react";
import { useEditorStore } from "@/hooks/use-editor-store";
import { ImageUploader } from "./image-uploader";
import { ExportPanel } from "./export-panel";
import { CropMode } from "@/components/crop/crop-mode";
import { ResizeMode } from "@/components/resize/resize-mode";
import { ResizePreview } from "@/components/resize/resize-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorMode } from "@/types/editor";

const MODES: { id: EditorMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "crop",   label: "裁切", Icon: Crop },
  { id: "resize", label: "縮放", Icon: Maximize2 },
];

export function ImageEditor() {
  const source   = useEditorStore((s) => s.source);
  const mode     = useEditorStore((s) => s.mode);
  const loadImage = useEditorStore((s) => s.loadImage);
  const setMode  = useEditorStore((s) => s.setMode);

  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);
  const undo = useCallback(() => useEditorStore.temporal.getState().undo(), []);
  const redo = useCallback(() => useEditorStore.temporal.getState().redo(), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, canRedo, undo, redo]);

  if (!source) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-center mb-2">Pixpeel</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            圖片裁切與縮放工具
          </p>
          <ImageUploader onFileSelect={loadImage} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Header ── */}
      <header className="flex items-center h-12 px-4 border-b shrink-0 gap-2">
        <span className="font-bold text-base w-20 shrink-0">Pixpeel</span>

        <div className="flex flex-1 items-center justify-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="復原">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="重做">
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <ExportPanel />
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar – mode switcher */}
        <aside className="flex flex-col items-center w-20 border-r shrink-0 pt-3 gap-1">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-xl gap-1.5 text-xs font-medium transition-colors cursor-pointer",
                mode === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </aside>

        {/* Main canvas area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {mode === "crop"   && <CropMode />}
          {mode === "resize" && <ResizePreview />}
        </div>

        {/* Right panel – resize controls */}
        {mode === "resize" && (
          <aside className="w-64 border-l overflow-y-auto p-4 shrink-0">
            <ResizeMode />
          </aside>
        )}

      </div>
    </div>
  );
}

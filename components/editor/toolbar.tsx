"use client";

import { useEffect } from "react";
import { Crop, Maximize2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EditorMode } from "@/types/editor";

interface ToolbarProps {
  mode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  onCropMode: () => void;
  onResizeMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function Toolbar({
  mode,
  canUndo,
  canRedo,
  onCropMode,
  onResizeMode,
  onUndo,
  onRedo,
}: ToolbarProps) {
  // 鍵盤快捷鍵：Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) onRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-background">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={mode === "crop" ? "default" : "ghost"}
              size="icon"
              onClick={onCropMode}
              aria-label="裁切模式"
            />
          }
        >
          <Crop className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>裁切</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant={mode === "resize" ? "default" : "ghost"}
              size="icon"
              onClick={onResizeMode}
              aria-label="縮放模式"
            />
          }
        >
          <Maximize2 className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>調整尺寸</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="復原"
            />
          }
        >
          <Undo2 className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>復原 (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="重做"
            />
          }
        >
          <Redo2 className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>重做 (Ctrl+Y)</TooltipContent>
      </Tooltip>
    </div>
  );
}

"use client";

import { useCallback, useEffect } from "react";
import { useStore } from "zustand";
import { useEditorStore } from "@/hooks/use-editor-store";
import { ImageUploader } from "./image-uploader";
import { Toolbar } from "./toolbar";
import { ExportPanel } from "./export-panel";
import { CropMode } from "@/components/crop/crop-mode";
import { ResizeMode } from "@/components/resize/resize-mode";

export function ImageEditor() {
  const source = useEditorStore((s) => s.source);
  const mode = useEditorStore((s) => s.mode);
  const loadImage = useEditorStore((s) => s.loadImage);
  const setMode = useEditorStore((s) => s.setMode);

  // react-easy-crop 掛載時會自動觸發 onCropComplete，導致 setCropBox 在 loadImage clear() 之後
  // 再次寫入歷史。在 source 改變後（parent effect 晚於 child effects 執行），補一次 clear()。
  useEffect(() => {
    if (source) {
      useEditorStore.temporal.getState().clear();
    }
  }, [source]);

  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);
  const undo = useCallback(() => useEditorStore.temporal.getState().undo(), []);
  const redo = useCallback(() => useEditorStore.temporal.getState().redo(), []);

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
    <div className="flex flex-col h-screen">
      <Toolbar
        mode={mode}
        canUndo={canUndo}
        canRedo={canRedo}
        onCropMode={() => setMode("crop")}
        onResizeMode={() => setMode("resize")}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左側：預覽區 */}
        <div className="flex-1 overflow-hidden">
          {mode === "crop" && <CropMode />}
          {mode === "resize" && (
            <div className="flex items-center justify-center h-full bg-muted/20 text-muted-foreground text-sm">
              設定目標尺寸後點擊下載
            </div>
          )}
        </div>

        {/* 右側：控制面板 */}
        {mode === "resize" && (
          <div className="w-72 border-l overflow-y-auto p-4">
            <ResizeMode />
          </div>
        )}
      </div>

      <ExportPanel />
    </div>
  );
}

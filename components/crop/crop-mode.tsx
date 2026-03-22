"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { CropCanvas } from "./crop-canvas";
import { AspectRatioSelector } from "./aspect-ratio-selector";
import { AutoCropControls } from "./auto-crop-controls";
import { useEditorStore } from "@/hooks/use-editor-store";

export function CropMode() {
  const source = useEditorStore((s) => s.source);
  const cropBox = useEditorStore((s) => s.cropBox);
  const zoom = useEditorStore((s) => s.zoom);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const autoCropConfig = useEditorStore((s) => s.autoCropConfig);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setCropBox = useEditorStore((s) => s.setCropBox);
  const updateCropBoxPreview = useEditorStore((s) => s.updateCropBoxPreview);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const setAutoCropConfig = useEditorStore((s) => s.setAutoCropConfig);
  const runAutoCrop = useEditorStore((s) => s.runAutoCrop);

  const handleRunAutoCrop = useCallback(async () => {
    try {
      await runAutoCrop();
    } catch (err) {
      if (err instanceof Error && err.message === "all-background") {
        toast.warning("無法偵測到非背景內容，請調整容差或手動裁切");
      } else {
        toast.error("自動裁切失敗，請重試");
      }
    }
  }, [runAutoCrop]);

  if (!source || !cropBox) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <CropCanvas
          imageSrc={source.objectUrl}
          cropBox={cropBox}
          zoom={zoom}
          aspectRatio={aspectRatio.ratio}
          onCropChange={updateCropBoxPreview}
          onCropComplete={setCropBox}
          onZoomChange={setZoom}
        />
      </div>

      <div className="flex flex-col gap-4 px-4 py-3 border-t shrink-0">
        <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
        <AutoCropControls
          config={autoCropConfig}
          isProcessing={isProcessing}
          onConfigChange={setAutoCropConfig}
          onRunAutoCrop={handleRunAutoCrop}
        />
      </div>
    </div>
  );
}

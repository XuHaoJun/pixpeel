"use client";

import { useEditorStore } from "@/hooks/use-editor-store";
import { CropCanvas } from "./crop-canvas";

export function CropMode() {
  const source = useEditorStore((s) => s.source);
  const cropBox = useEditorStore((s) => s.cropBox);
  const zoom = useEditorStore((s) => s.zoom);
  const setCropBox = useEditorStore((s) => s.setCropBox);
  const updateCropBoxPreview = useEditorStore((s) => s.updateCropBoxPreview);
  const setZoom = useEditorStore((s) => s.setZoom);

  if (!source || !cropBox) return null;

  return (
    <div className="h-full overflow-hidden">
      <CropCanvas
        imageSrc={source.objectUrl}
        cropBox={cropBox}
        zoom={zoom}
        aspectRatio={null}
        onCropChange={updateCropBoxPreview}
        onCropComplete={setCropBox}
        onZoomChange={setZoom}
      />
    </div>
  );
}

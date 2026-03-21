"use client";

import { useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import type { CropBox } from "@/types/editor";

interface CropCanvasProps {
  imageSrc: string;
  cropBox: CropBox;
  zoom: number;
  aspectRatio: number | null;
  onCropChange: (box: CropBox) => void;
  onCropComplete: (box: CropBox) => void;
  onZoomChange: (zoom: number) => void;
}

export function CropCanvas({
  imageSrc,
  cropBox,
  zoom,
  aspectRatio,
  onCropChange,
  onCropComplete,
  onZoomChange,
}: CropCanvasProps) {
  // react-easy-crop 的 crop 座標是相對於顯示區域的百分比
  // onCropComplete 的 croppedAreaPixels 才是實際像素座標
  const crop = { x: 0, y: 0 };

  const handleCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      onCropComplete({
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      });
    },
    [onCropComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[400px] bg-checkerboard">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio ?? undefined}
        onCropChange={() => {
          // react-easy-crop 的 onCropChange 提供顯示區域偏移，不需要轉成 CropBox
          // 我們在 onCropComplete 才取像素值
        }}
        onCropComplete={handleCropComplete}
        onZoomChange={onZoomChange}
        showGrid
        style={{
          containerStyle: { width: "100%", height: "100%", position: "relative" },
        }}
      />
    </div>
  );
}

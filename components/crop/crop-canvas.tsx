"use client";

import { useCallback, useRef } from "react";
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
  const crop = { x: 0, y: 0 };

  // react-easy-crop 初始化時會從 recomputeCropPosition / onMediaLoad 觸發多次
  // onCropComplete（實測 4 次），全部都在使用者互動之前。
  // 用 pointerdown 旗標判斷「使用者是否真正開始拖動」：
  //   - 未互動前：所有 onCropComplete 走 onCropChange（= updateCropBoxPreview，不寫歷史）
  //   - 互動後：走 onCropComplete（= setCropBox，正常寫歷史）
  // imageSrc 改變時同步重置旗標（在 render 期間），確保新圖載入時重新等待互動。
  const hasInteractedRef = useRef(false);
  const prevImageSrcRef = useRef(imageSrc);
  if (prevImageSrcRef.current !== imageSrc) {
    prevImageSrcRef.current = imageSrc;
    hasInteractedRef.current = false;
  }

  const handleCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      const box: CropBox = {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      };
      if (!hasInteractedRef.current) {
        onCropChange(box); // 初始化觸發 — 不寫歷史
        return;
      }
      onCropComplete(box); // 使用者互動後 — 正常寫歷史
    },
    [onCropChange, onCropComplete]
  );

  return (
    <div
      className="relative w-full h-full min-h-[400px] bg-checkerboard"
      onPointerDown={() => { hasInteractedRef.current = true; }}
    >
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

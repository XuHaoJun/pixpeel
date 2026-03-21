"use client";

import type { CropBox, OutputFormat } from "@/types/editor";

/**
 * T011: 從來源圖片裁切指定區域，返回 canvas
 */
export function cropToCanvas(
  image: HTMLImageElement,
  cropBox: CropBox
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropBox.width);
  canvas.height = Math.round(cropBox.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法取得 2D context");
  ctx.drawImage(
    image,
    Math.round(cropBox.x),
    Math.round(cropBox.y),
    Math.round(cropBox.width),
    Math.round(cropBox.height),
    0,
    0,
    Math.round(cropBox.width),
    Math.round(cropBox.height)
  );
  return canvas;
}

/**
 * 從 canvas 匯出圖片 Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob 回傳 null"));
      },
      format,
      quality
    );
  });
}

/**
 * 觸發瀏覽器下載
 */
export function downloadBlob(
  blob: Blob,
  fileName: string,
  format: OutputFormat
): void {
  const ext = format.split("/")[1];
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}-edited.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

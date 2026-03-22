"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
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
  aspectRatio,
  onCropChange,
  onCropComplete,
}: CropCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  // Track the last cropBox value we reported or synced, to distinguish
  // external changes (undo/redo, auto-crop) from our own updates.
  const lastCropBoxRef = useRef<CropBox | null>(null);

  const toNaturalBox = useCallback((px: PixelCrop): CropBox | null => {
    const img = imgRef.current;
    if (!img) return null;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    return {
      x: Math.round(px.x * scaleX),
      y: Math.round(px.y * scaleY),
      width: Math.round(px.width * scaleX),
      height: Math.round(px.height * scaleY),
    };
  }, []);

  const toCrop = (box: CropBox, img: HTMLImageElement): Crop => ({
    unit: "%",
    x: (box.x / img.naturalWidth) * 100,
    y: (box.y / img.naturalHeight) * 100,
    width: (box.width / img.naturalWidth) * 100,
    height: (box.height / img.naturalHeight) * 100,
  });

  // When image loads, initialize crop selection from cropBox
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    lastCropBoxRef.current = cropBox;
    setCrop(toCrop(cropBox, img));
  // cropBox intentionally not in deps: only run on image load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // Sync external cropBox changes (undo/redo, auto-crop) to internal state
  useEffect(() => {
    const img = imgRef.current;
    if (!img || img.naturalWidth === 0) return;
    const prev = lastCropBoxRef.current;
    if (
      prev &&
      prev.x === cropBox.x &&
      prev.y === cropBox.y &&
      prev.width === cropBox.width &&
      prev.height === cropBox.height
    ) return;
    lastCropBoxRef.current = cropBox;
    setCrop(toCrop(cropBox, img));
  }, [cropBox]);

  const handleChange = useCallback(
    (px: PixelCrop) => {
      setCrop(px);
      const box = toNaturalBox(px);
      if (box) {
        lastCropBoxRef.current = box;
        onCropChange(box);
      }
    },
    [toNaturalBox, onCropChange]
  );

  const handleComplete = useCallback(
    (px: PixelCrop) => {
      if (px.width < 1 || px.height < 1) return;
      const box = toNaturalBox(px);
      if (box) {
        lastCropBoxRef.current = box;
        onCropComplete(box);
      }
    },
    [toNaturalBox, onCropComplete]
  );

  return (
    <div className="relative w-full h-full min-h-[400px] bg-checkerboard flex items-center justify-center overflow-auto p-4">
      <ReactCrop
        crop={crop}
        onChange={handleChange}
        onComplete={handleComplete}
        aspect={aspectRatio ?? undefined}
        keepSelection
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "calc(100vh - 300px)" }}
          onLoad={handleImageLoad}
        />
      </ReactCrop>
    </div>
  );
}

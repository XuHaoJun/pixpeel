"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/hooks/use-editor-store";
import { cropToCanvas } from "@/lib/image-export";

export function ResizePreview() {
  const source = useEditorStore((s) => s.source);
  const cropBox = useEditorStore((s) => s.cropBox);
  const resizeConfig = useEditorStore((s) => s.resizeConfig);
  const exportConfig = useEditorStore((s) => s.exportConfig);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!source || !cropBox || !resizeConfig) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsGenerating(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = source.objectUrl;
        });

        let canvas = cropToCanvas(img, cropBox);

        const { resizeImage } = await import("@/lib/resize");
        const effectiveBgColor =
          exportConfig.format === "image/jpeg" && resizeConfig.bgColor === "transparent"
            ? "#ffffff"
            : resizeConfig.bgColor;
        canvas = await resizeImage(canvas, { ...resizeConfig, bgColor: effectiveBgColor });

        const dataUrl = canvas.toDataURL(exportConfig.format, exportConfig.quality);
        setPreviewUrl(dataUrl);
      } catch {
        // keep showing previous preview on error
      } finally {
        setIsGenerating(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [source, cropBox, resizeConfig, exportConfig]);

  return (
    <div className="relative flex items-center justify-center w-full h-full bg-checkerboard">
      {previewUrl && (
        <img
          src={previewUrl}
          alt="resize preview"
          className="max-w-full max-h-full object-contain"
        />
      )}

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <span className="text-sm text-muted-foreground">處理中…</span>
        </div>
      )}

      {resizeConfig && previewUrl && (
        <div className="absolute bottom-2 right-2 text-xs bg-background/80 px-2 py-1 rounded pointer-events-none">
          {resizeConfig.targetWidth} × {resizeConfig.targetHeight}
        </div>
      )}
    </div>
  );
}

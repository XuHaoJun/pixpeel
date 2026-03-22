"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        toast.error("不支援此格式，請上傳 JPEG、PNG 或 WebP");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0] ?? null);
    },
    [handleFile]
  );

  const handleUrlLoad = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setIsLoadingUrl(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const type = blob.type || "image/jpeg";
      if (!ACCEPTED_FORMATS.includes(type)) {
        toast.error("網址圖片格式不支援，請使用 JPEG、PNG 或 WebP");
        return;
      }
      const fileName = url.split("/").pop()?.split("?")[0] || "image.jpg";
      onFileSelect(new File([blob], fileName, { type }));
    } catch {
      toast.error("無法載入圖片，請確認網址是否正確且允許跨來源存取");
    } finally {
      setIsLoadingUrl(false);
    }
  }, [urlInput, onFileSelect]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">點擊或拖曳圖片至此</p>
        <p className="text-xs text-muted-foreground mt-1">支援 JPEG、PNG、WebP</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="或輸入圖片網址…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleUrlLoad(); }}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={handleUrlLoad}
          disabled={!urlInput.trim() || isLoadingUrl}
        >
          {isLoadingUrl ? "載入中…" : "載入"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
}

export function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
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
  );
}

"use client";

import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OutputFormat } from "@/types/editor";

interface BackgroundColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  format: OutputFormat;
}

export function BackgroundColorPicker({ color, onChange, format }: BackgroundColorPickerProps) {
  const isJpeg = format === "image/jpeg";
  const isTransparent = color === "transparent";
  const showJpegWarning = isJpeg && isTransparent;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">背景色（Contain 留白區域）</span>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger
            className="w-8 h-8 rounded border border-input shrink-0 checkerboard-sm"
            style={{ backgroundColor: isTransparent ? undefined : color }}
            aria-label="選擇背景色"
          />
          <PopoverContent className="w-auto p-3 flex flex-col gap-2">
            <HexColorPicker
              color={isTransparent ? "#ffffff" : color}
              onChange={onChange}
            />
            <Input
              value={isTransparent ? "" : color}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#ffffff"
              className="h-7 text-xs"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant={isTransparent ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onChange("transparent")}
        >
          透明
        </Button>

        {!isTransparent && (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: color, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {color}
          </span>
        )}
      </div>

      {showJpegWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          JPEG 不支援透明，將自動填白
        </p>
      )}
    </div>
  );
}

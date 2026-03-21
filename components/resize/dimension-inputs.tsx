"use client";

import { useState } from "react";
import { Link2, Link2Off } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DimensionInputsProps {
  width: number;
  height: number;
  linked: boolean;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onLinkedChange: (linked: boolean) => void;
}

function isValidDimension(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n >= 1 && String(n) === v.trim();
}

export function DimensionInputs({
  width,
  height,
  linked,
  onWidthChange,
  onHeightChange,
  onLinkedChange,
}: DimensionInputsProps) {
  const [widthStr, setWidthStr] = useState(String(width));
  const [heightStr, setHeightStr] = useState(String(height));
  const [widthError, setWidthError] = useState(false);
  const [heightError, setHeightError] = useState(false);

  const aspectRatio = width > 0 ? width / height : 1;

  const handleWidthChange = (v: string) => {
    setWidthStr(v);
    if (!isValidDimension(v)) { setWidthError(true); return; }
    setWidthError(false);
    const n = parseInt(v, 10);
    onWidthChange(n);
    if (linked) {
      const h = Math.max(1, Math.round(n / aspectRatio));
      setHeightStr(String(h));
      setHeightError(false);
      onHeightChange(h);
    }
  };

  const handleHeightChange = (v: string) => {
    setHeightStr(v);
    if (!isValidDimension(v)) { setHeightError(true); return; }
    setHeightError(false);
    const n = parseInt(v, 10);
    onHeightChange(n);
    if (linked) {
      const w = Math.max(1, Math.round(n * aspectRatio));
      setWidthStr(String(w));
      setWidthError(false);
      onWidthChange(w);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">目標尺寸（像素）</span>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-muted-foreground">寬</label>
          <Input
            type="number"
            min={1}
            value={widthStr}
            onChange={(e) => handleWidthChange(e.target.value)}
            className={`h-8 text-sm ${widthError ? "border-destructive" : ""}`}
            aria-label="目標寬度"
          />
          {widthError && <span className="text-[10px] text-destructive">請輸入正整數</span>}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="mt-4 h-8 w-8 shrink-0"
          onClick={() => onLinkedChange(!linked)}
          aria-label={linked ? "解除連動" : "鎖定比例"}
        >
          {linked ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
        </Button>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-muted-foreground">高</label>
          <Input
            type="number"
            min={1}
            value={heightStr}
            onChange={(e) => handleHeightChange(e.target.value)}
            className={`h-8 text-sm ${heightError ? "border-destructive" : ""}`}
            aria-label="目標高度"
          />
          {heightError && <span className="text-[10px] text-destructive">請輸入正整數</span>}
        </div>
      </div>
    </div>
  );
}

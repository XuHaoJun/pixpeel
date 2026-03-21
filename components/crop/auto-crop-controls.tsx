"use client";

import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AutoCropConfig } from "@/types/editor";

interface AutoCropControlsProps {
  config: AutoCropConfig;
  isProcessing: boolean;
  onConfigChange: (config: AutoCropConfig) => void;
  onRunAutoCrop: () => void;
}

export function AutoCropControls({
  config,
  isProcessing,
  onConfigChange,
  onRunAutoCrop,
}: AutoCropControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onRunAutoCrop}
        disabled={isProcessing}
        className="w-full gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        自動裁切
      </Button>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">容差</span>
          <span className="text-xs tabular-nums">{config.thresholdPercent}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={config.thresholdPercent}
          onValueChange={(v) => onConfigChange({ thresholdPercent: v as number })}
          className="w-full"
        />
      </div>
    </div>
  );
}

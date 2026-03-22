"use client";

import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useEditorStore } from "@/hooks/use-editor-store";
import type { OutputFormat } from "@/types/editor";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
};

export function ExportPanel() {
  const exportConfig = useEditorStore((s) => s.exportConfig);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setExportConfig = useEditorStore((s) => s.setExportConfig);
  const exportImage = useEditorStore((s) => s.exportImage);

  const showQuality = exportConfig.format !== "image/png";

  const handleExport = async () => {
    try {
      await exportImage();
      toast.success("圖片已下載");
    } catch {
      toast.error("匯出失敗，請重試");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={exportConfig.format}
        onValueChange={(v) => setExportConfig({ format: v as OutputFormat })}
      >
        <SelectTrigger className="w-28 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((fmt) => (
            <SelectItem key={fmt} value={fmt}>
              {FORMAT_LABELS[fmt]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showQuality && (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">品質</span>
          <Slider
            min={1}
            max={100}
            step={1}
            value={Math.round(exportConfig.quality * 100)}
            onValueChange={(v) => setExportConfig({ quality: (v as number) / 100 })}
            className="flex-1"
          />
          <span className="text-xs tabular-nums w-8">
            {Math.round(exportConfig.quality * 100)}%
          </span>
        </div>
      )}

      <Button
        size="sm"
        onClick={handleExport}
        disabled={isProcessing}
        className="gap-1.5"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        下載
      </Button>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronsUpDown, Clock, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PresetSize {
  label: string;
  platform: string;
  width: number;
  height: number;
}

const PRESET_GROUPS: { platform: string; items: PresetSize[] }[] = [
  {
    platform: "LINE",
    items: [
      { label: "圖文選單大型 (Full)", platform: "LINE", width: 2500, height: 1686 },
      { label: "圖文選單小型 (Half)", platform: "LINE", width: 2500, height: 843 },
      { label: "圖文訊息", platform: "LINE", width: 1040, height: 1040 },
      { label: "多頁訊息卡片", platform: "LINE", width: 1040, height: 585 },
      { label: "優惠券", platform: "LINE", width: 1040, height: 1040 },
      { label: "集點卡背景 (2:1)", platform: "LINE", width: 1040, height: 520 },
      { label: "官方帳號封面", platform: "LINE", width: 2560, height: 1280 },
    ],
  },
  {
    platform: "Instagram",
    items: [
      { label: "限時動態 / Reels (9:16)", platform: "Instagram", width: 1080, height: 1920 },
      { label: "正方形貼文 (1:1)", platform: "Instagram", width: 1080, height: 1080 },
      { label: "直式貼文 (4:5)", platform: "Instagram", width: 1080, height: 1350 },
      { label: "大頭貼", platform: "Instagram", width: 320, height: 320 },
    ],
  },
  {
    platform: "Facebook",
    items: [
      { label: "粉專封面照", platform: "Facebook", width: 820, height: 461 },
      { label: "社團封面照", platform: "Facebook", width: 1640, height: 856 },
      { label: "活動封面", platform: "Facebook", width: 1920, height: 1005 },
    ],
  },
  {
    platform: "廣告",
    items: [
      { label: "單一圖片廣告 (1.91:1)", platform: "廣告", width: 1200, height: 628 },
      { label: "Google 回應式 (橫)", platform: "廣告", width: 1200, height: 628 },
      { label: "Google 回應式 (方)", platform: "廣告", width: 1200, height: 1200 },
    ],
  },
];

const ALL_PRESETS = PRESET_GROUPS.flatMap((g) => g.items);
const HISTORY_KEY = "pixpeel-preset-history";
const HISTORY_MAX = 3;

function loadHistory(): PresetSize[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as PresetSize[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: PresetSize[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function addToHistory(preset: PresetSize, current: PresetSize[]): PresetSize[] {
  const deduped = current.filter(
    (p) => !(p.width === preset.width && p.height === preset.height && p.label === preset.label)
  );
  return [preset, ...deduped].slice(0, HISTORY_MAX);
}

interface PresetSizeSelectorProps {
  currentWidth: number;
  currentHeight: number;
  onSelect: (width: number, height: number) => void;
}

export function PresetSizeSelector({
  currentWidth,
  currentHeight,
  onSelect,
}: PresetSizeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<PresetSize[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Derive selected label from current dimensions (auto-clears when user manually edits)
  const matched = ALL_PRESETS.find(
    (p) => p.width === currentWidth && p.height === currentHeight
  );

  const handleSelect = useCallback(
    (preset: PresetSize) => {
      onSelect(preset.width, preset.height);
      const next = addToHistory(preset, history);
      setHistory(next);
      saveHistory(next);
      setOpen(false);
    },
    [history, onSelect]
  );

  const clearHistory = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHistory([]);
      saveHistory([]);
    },
    []
  );

  const PresetRow = ({ preset }: { preset: PresetSize }) => (
    <CommandItem
      key={`${preset.label}-${preset.width}x${preset.height}`}
      value={`${preset.platform} ${preset.label} ${preset.width} ${preset.height}`}
      onSelect={() => handleSelect(preset)}
      data-checked={matched?.label === preset.label && matched?.width === preset.width}
      className="flex items-center justify-between"
    >
      <span className="truncate">{preset.label}</span>
      <span className="ml-2 shrink-0 text-xs text-muted-foreground tabular-nums">
        {preset.width} × {preset.height}
      </span>
    </CommandItem>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">快速套用預設尺寸</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !matched && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {matched ? `${matched.platform} — ${matched.label}` : "選擇預設尺寸…"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start" side="bottom">
          <Command>
            <CommandInput placeholder="搜尋預設尺寸…" />
            <CommandList>
              <CommandEmpty>找不到符合的預設尺寸</CommandEmpty>

              {/* Recent history */}
              {history.length > 0 && (
                <>
                  <CommandGroup
                    heading={
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          最近使用
                        </span>
                        <button
                          onClick={clearHistory}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                          aria-label="清除歷史"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    }
                  >
                    {history.map((p) => (
                      <PresetRow key={`hist-${p.label}-${p.width}x${p.height}`} preset={p} />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Grouped presets */}
              {PRESET_GROUPS.map((group) => (
                <CommandGroup key={group.platform} heading={group.platform}>
                  {group.items.map((preset) => (
                    <PresetRow key={`${preset.label}-${preset.width}x${preset.height}`} preset={preset} />
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

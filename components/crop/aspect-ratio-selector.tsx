"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AspectRatioLock, AspectRatioPreset } from "@/types/editor";

const PRESETS: { value: AspectRatioPreset; label: string; ratio: number | null }[] = [
  { value: "free", label: "自由", ratio: null },
  { value: "1:1", label: "1:1", ratio: 1 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "9:16", label: "9:16", ratio: 9 / 16 },
];

interface AspectRatioSelectorProps {
  value: AspectRatioLock;
  onChange: (lock: AspectRatioLock) => void;
}

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">長寬比</span>
      <ToggleGroup
        value={[value.preset]}
        onValueChange={(v) => {
          const next = v[0];
          if (!next) return;
          const preset = next as AspectRatioPreset;
          const found = PRESETS.find((p) => p.value === preset);
          onChange({ preset, ratio: found?.ratio ?? null });
        }}
        className="flex flex-wrap gap-1"
      >
        {PRESETS.map((p) => (
          <ToggleGroupItem
            key={p.value}
            value={p.value}
            aria-label={p.label}
            className="text-xs h-7 px-2"
          >
            {p.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

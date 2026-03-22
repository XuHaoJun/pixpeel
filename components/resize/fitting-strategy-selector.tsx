"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FittingStrategy } from "@/types/editor";

const STRATEGIES: { value: FittingStrategy; label: string; description: string }[] = [
  { value: "contain", label: "Contain", description: "完整顯示，留白" },
  { value: "cover", label: "Cover", description: "填滿，居中裁切" },
  { value: "fill", label: "Fill", description: "強制填滿，可變形" },
];

interface FittingStrategySelectorProps {
  value: FittingStrategy;
  onChange: (strategy: FittingStrategy) => void;
}

export function FittingStrategySelector({ value, onChange }: FittingStrategySelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">適配策略</span>
      <ToggleGroup
        value={[value]}
        onValueChange={(v) => { const next = v[0]; if (next) onChange(next as FittingStrategy); }}
        orientation="vertical"
        className="w-full"
      >
        {STRATEGIES.map((s) => (
          <ToggleGroupItem
            key={s.value}
            value={s.value}
            className="w-full justify-start h-auto py-2 px-3 gap-3"
            aria-label={s.label}
          >
            <span className="text-sm font-medium w-14 shrink-0 text-left">{s.label}</span>
            <span className="text-xs text-muted-foreground text-left">{s.description}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

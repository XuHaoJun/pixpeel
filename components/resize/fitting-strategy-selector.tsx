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
        className="flex gap-1 w-full"
      >
        {STRATEGIES.map((s) => (
          <ToggleGroupItem
            key={s.value}
            value={s.value}
            className="flex-1 flex flex-col h-auto py-2 px-1 gap-0.5"
            aria-label={s.label}
          >
            <span className="text-xs font-semibold">{s.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{s.description}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

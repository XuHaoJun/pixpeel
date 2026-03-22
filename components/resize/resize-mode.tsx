"use client";

import { useState } from "react";
import { DimensionInputs } from "./dimension-inputs";
import { FittingStrategySelector } from "./fitting-strategy-selector";
import { BackgroundColorPicker } from "./background-color-picker";
import { PresetSizeSelector } from "./preset-size-selector";
import { useEditorStore } from "@/hooks/use-editor-store";

export function ResizeMode() {
  const resizeConfig = useEditorStore((s) => s.resizeConfig);
  const exportConfig = useEditorStore((s) => s.exportConfig);
  const setResizeConfig = useEditorStore((s) => s.setResizeConfig);
  const [linked, setLinked] = useState(false);

  if (!resizeConfig) return null;

  return (
    <div className="flex flex-col gap-5 px-1">
      <PresetSizeSelector
        currentWidth={resizeConfig.targetWidth}
        currentHeight={resizeConfig.targetHeight}
        onSelect={(w, h) => setResizeConfig({ targetWidth: w, targetHeight: h })}
      />

      <DimensionInputs
        width={resizeConfig.targetWidth}
        height={resizeConfig.targetHeight}
        linked={linked}
        onWidthChange={(w) => setResizeConfig({ targetWidth: w })}
        onHeightChange={(h) => setResizeConfig({ targetHeight: h })}
        onLinkedChange={setLinked}
      />

      <FittingStrategySelector
        value={resizeConfig.fittingStrategy}
        onChange={(s) => setResizeConfig({ fittingStrategy: s })}
      />

      {resizeConfig.fittingStrategy === "contain" && (
        <BackgroundColorPicker
          color={resizeConfig.bgColor}
          onChange={(c) => setResizeConfig({ bgColor: c })}
          format={exportConfig.format}
        />
      )}
    </div>
  );
}

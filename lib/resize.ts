import type { ResizeConfig, FittingStrategy } from "@/types/editor";

/**
 * T035: 計算三種適配策略的幾何參數
 */
export function computeFitRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  strategy: FittingStrategy
): {
  intermediateW: number;
  intermediateH: number;
  dx: number;
  dy: number;
} {
  if (strategy === "fill") {
    return { intermediateW: dstW, intermediateH: dstH, dx: 0, dy: 0 };
  }

  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;

  let intermediateW: number;
  let intermediateH: number;

  if (strategy === "contain") {
    if (srcRatio > dstRatio) {
      intermediateW = dstW;
      intermediateH = dstW / srcRatio;
    } else {
      intermediateH = dstH;
      intermediateW = dstH * srcRatio;
    }
  } else {
    // cover
    if (srcRatio > dstRatio) {
      intermediateH = dstH;
      intermediateW = dstH * srcRatio;
    } else {
      intermediateW = dstW;
      intermediateH = dstW / srcRatio;
    }
  }

  const dx = (dstW - intermediateW) / 2;
  const dy = (dstH - intermediateH) / 2;

  return {
    intermediateW: Math.round(intermediateW),
    intermediateH: Math.round(intermediateH),
    dx: Math.round(dx),
    dy: Math.round(dy),
  };
}

/**
 * 使用 pica 對圖片進行高品質縮放，支援三種適配策略
 * pica 使用動態 import 避免 Next.js SSR 拋出 window is not defined
 */
export async function resizeImage(
  sourceCanvas: HTMLCanvasElement,
  config: ResizeConfig
): Promise<HTMLCanvasElement> {
  const { default: Pica } = await import("pica");
  const picaInstance = new Pica();

  const { targetWidth, targetHeight, fittingStrategy, bgColor } = config;
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;

  const { intermediateW, intermediateH, dx, dy } = computeFitRect(
    srcW,
    srcH,
    targetWidth,
    targetHeight,
    fittingStrategy
  );

  // 先縮放到 intermediate 尺寸
  const intermediate = document.createElement("canvas");
  intermediate.width = intermediateW;
  intermediate.height = intermediateH;

  await picaInstance.resize(sourceCanvas, intermediate, { quality: 3 });

  // 合成到最終尺寸的 canvas
  const final = document.createElement("canvas");
  final.width = targetWidth;
  final.height = targetHeight;
  const ctx = final.getContext("2d");
  if (!ctx) throw new Error("無法取得 2D context");

  // Contain 策略：填滿背景色
  if (fittingStrategy === "contain" && bgColor && bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (fittingStrategy === "cover") {
    // Cover：居中裁切，只取目標範圍內的部分
    ctx.drawImage(intermediate, dx, dy);
  } else {
    ctx.drawImage(intermediate, dx, dy);
  }

  return final;
}

import type { CropBox } from "@/types/editor";

/**
 * T028: 找出圖片中非背景顏色的最小邊界框
 * TypeScript 移植自 auto-crop-1.js (findCropBoxJS)
 * 算法完全相同，加入型別標註
 *
 * @param imageData - 來自 canvas.getContext('2d').getImageData() 的物件
 * @param thresholdPercent - 容差百分比（0–100）
 * @returns CropBox，若全圖皆為背景則返回覆蓋全圖的 CropBox
 */
export function findCropBox(
  imageData: ImageData,
  thresholdPercent: number
): CropBox {
  const pixels = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // 以左上角像素作為背景色基準
  const bgR = pixels[0];
  const bgG = pixels[1];
  const bgB = pixels[2];

  // 預先計算平方容差值（避開 Math.sqrt 提升效能）
  // 3D 空間最大距離平方 = 255^2 * 3 = 195075
  const MAX_DIST_SQ = 195075;
  const thresholdFraction = thresholdPercent / 100.0;
  const thresholdSq = MAX_DIST_SQ * thresholdFraction * thresholdFraction;

  const isDifferent = (idx: number): boolean => {
    const dr = pixels[idx] - bgR;
    const dg = pixels[idx + 1] - bgG;
    const db = pixels[idx + 2] - bgB;
    return dr * dr + dg * dg + db * db > thresholdSq;
  };

  let cropTop = 0;
  let cropBottom = 0;
  let cropLeft = 0;
  let cropRight = 0;

  // 由上往下掃
  topLoop: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isDifferent((y * width + x) * 4)) break topLoop;
    }
    cropTop++;
  }

  // 全圖皆為背景
  if (cropTop === height) {
    return { x: 0, y: 0, width, height };
  }

  // 由下往上掃
  bottomLoop: for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (isDifferent((y * width + x) * 4)) break bottomLoop;
    }
    cropBottom++;
  }

  // 由左往右掃（只掃未裁切掉的 Y 軸範圍）
  leftLoop: for (let x = 0; x < width; x++) {
    for (let y = cropTop; y < height - cropBottom; y++) {
      if (isDifferent((y * width + x) * 4)) break leftLoop;
    }
    cropLeft++;
  }

  // 由右往左掃
  rightLoop: for (let x = width - 1; x >= 0; x--) {
    for (let y = cropTop; y < height - cropBottom; y++) {
      if (isDifferent((y * width + x) * 4)) break rightLoop;
    }
    cropRight++;
  }

  return {
    x: cropLeft,
    y: cropTop,
    width: width - cropLeft - cropRight,
    height: height - cropTop - cropBottom,
  };
}

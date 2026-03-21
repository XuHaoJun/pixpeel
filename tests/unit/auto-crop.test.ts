import { describe, it, expect } from "vitest";
import { findCropBox } from "@/lib/auto-crop";

function makeImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

describe("findCropBox", () => {
  it("全圖皆為背景色時回傳全圖尺寸", () => {
    const imageData = makeImageData(100, 100, () => [255, 255, 255, 255]);
    const result = findCropBox(imageData, 5);
    expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it("四周有白色邊框時正確找出主體邊界", () => {
    // 10px 白色邊框，內部為黑色主體
    const imageData = makeImageData(100, 100, (x, y) => {
      if (x < 10 || x >= 90 || y < 10 || y >= 90) return [255, 255, 255, 255];
      return [0, 0, 0, 255];
    });
    const result = findCropBox(imageData, 5);
    expect(result.x).toBe(10);
    expect(result.y).toBe(10);
    expect(result.width).toBe(80);
    expect(result.height).toBe(80);
  });

  it("容差為 0 時能偵測到輕微色差", () => {
    // 背景為純白 (255,255,255)，主體為接近白色的淺灰 (250,250,250)
    const imageData = makeImageData(50, 50, (x, y) => {
      if (x < 5 || x >= 45 || y < 5 || y >= 45) return [255, 255, 255, 255];
      return [250, 250, 250, 255];
    });
    const result = findCropBox(imageData, 0);
    // threshold=0 時任何差異都算不同
    expect(result.x).toBe(5);
    expect(result.y).toBe(5);
  });

  it("容差較高時忽略輕微色差", () => {
    // 背景為純白，主體為接近白色的淺灰 (250,250,250)
    const imageData = makeImageData(50, 50, (x, y) => {
      if (x < 5 || x >= 45 || y < 5 || y >= 45) return [255, 255, 255, 255];
      return [254, 254, 254, 255]; // 非常接近背景
    });
    // threshold=20% 時差異太小應被忽略，回傳全圖
    const result = findCropBox(imageData, 20);
    expect(result).toEqual({ x: 0, y: 0, width: 50, height: 50 });
  });

  it("只有上方有邊框時正確找出 cropTop", () => {
    const imageData = makeImageData(50, 50, (x, y) => {
      if (y < 8) return [255, 255, 255, 255];
      return [0, 0, 0, 255];
    });
    const result = findCropBox(imageData, 5);
    expect(result.y).toBe(8);
    expect(result.height).toBe(42);
    expect(result.x).toBe(0);
    expect(result.width).toBe(50);
  });
});

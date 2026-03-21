import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cropToCanvas, canvasToBlob, downloadBlob } from "@/lib/image-export";
import type { CropBox, OutputFormat } from "@/types/editor";

// 在 jsdom 環境中 canvas 的 drawImage 不會真正渲染，測試聚焦在尺寸正確性
describe("cropToCanvas", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("輸出 canvas 的尺寸與 cropBox 相同", () => {
    const img = new Image();
    img.width = 800;
    img.height = 600;
    Object.defineProperty(img, "naturalWidth", { value: 800 });
    Object.defineProperty(img, "naturalHeight", { value: 600 });

    const cropBox: CropBox = { x: 100, y: 50, width: 300, height: 200 };
    const canvas = cropToCanvas(img, cropBox);

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(200);
  });

  it("四捨五入裁切座標", () => {
    const img = new Image();
    const cropBox: CropBox = { x: 10.7, y: 20.3, width: 150.9, height: 100.1 };
    const canvas = cropToCanvas(img, cropBox);
    expect(canvas.width).toBe(151);
    expect(canvas.height).toBe(100);
  });
});

describe("downloadBlob", () => {
  it("觸發瀏覽器下載，附加正確副檔名", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = vi.fn();
    const mockAnchor = { href: "", download: "", click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(mockAnchor);

    const blob = new Blob(["test"], { type: "image/jpeg" });
    downloadBlob(blob, "photo.jpg", "image/jpeg");

    expect(mockAnchor.download).toBe("photo-edited.jpeg");
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("PNG 副檔名正確", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();

    const mockAnchor = { href: "", download: "", click: vi.fn() } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(mockAnchor);

    downloadBlob(new Blob(), "image.png", "image/png");
    expect(mockAnchor.download).toBe("image-edited.png");
  });
});

describe("canvasToBlob", () => {
  it("canvas.toBlob 被呼叫並傳入正確 format 和 quality", async () => {
    const mockBlob = new Blob(["data"], { type: "image/jpeg" });
    const toBlobSpy = vi.fn().mockImplementation(
      (cb: (b: Blob | null) => void, _format: string, _quality: number) => cb(mockBlob)
    );

    const canvas = { toBlob: toBlobSpy } as unknown as HTMLCanvasElement;

    const result = await canvasToBlob(canvas, "image/jpeg", 0.9);
    expect(result).toBe(mockBlob);
    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.9);
  });
});

import { describe, it, expect } from "vitest";
import { computeFitRect } from "@/lib/resize";

describe("computeFitRect", () => {
  describe("fill 策略", () => {
    it("直接使用目標尺寸，不保持比例", () => {
      const result = computeFitRect(800, 600, 400, 400, "fill");
      expect(result).toEqual({ intermediateW: 400, intermediateH: 400, dx: 0, dy: 0 });
    });
  });

  describe("contain 策略", () => {
    it("橫向圖（寬 > 高比例）限制在寬度", () => {
      // src: 800x400 (ratio 2:1), dst: 400x400
      const result = computeFitRect(800, 400, 400, 400, "contain");
      expect(result.intermediateW).toBe(400);
      expect(result.intermediateH).toBe(200);
      expect(result.dx).toBe(0);
      expect(result.dy).toBe(100); // 置中：(400-200)/2
    });

    it("直向圖（高 > 寬比例）限制在高度", () => {
      // src: 400x800 (ratio 1:2), dst: 400x400
      const result = computeFitRect(400, 800, 400, 400, "contain");
      expect(result.intermediateH).toBe(400);
      expect(result.intermediateW).toBe(200);
      expect(result.dy).toBe(0);
      expect(result.dx).toBe(100); // 置中：(400-200)/2
    });

    it("正方形圖填滿目標正方形", () => {
      const result = computeFitRect(300, 300, 200, 200, "contain");
      expect(result.intermediateW).toBe(200);
      expect(result.intermediateH).toBe(200);
      expect(result.dx).toBe(0);
      expect(result.dy).toBe(0);
    });

    it("寬高不同的目標尺寸（非正方形）", () => {
      // src: 1000x500 (2:1), dst: 600x400
      // dstRatio = 600/400 = 1.5, srcRatio = 2
      // srcRatio > dstRatio → 限制寬度
      const result = computeFitRect(1000, 500, 600, 400, "contain");
      expect(result.intermediateW).toBe(600);
      expect(result.intermediateH).toBe(300);
      expect(result.dx).toBe(0);
      expect(result.dy).toBe(50); // (400-300)/2
    });
  });

  describe("cover 策略", () => {
    it("橫向圖填滿正方形目標，高度為基準", () => {
      // src: 800x400 (2:1), dst: 400x400
      const result = computeFitRect(800, 400, 400, 400, "cover");
      expect(result.intermediateH).toBe(400);
      expect(result.intermediateW).toBe(800);
      expect(result.dy).toBe(0);
      expect(result.dx).toBe(-200); // 置中裁切
    });

    it("直向圖填滿正方形目標，寬度為基準", () => {
      // src: 400x800 (1:2), dst: 400x400
      const result = computeFitRect(400, 800, 400, 400, "cover");
      expect(result.intermediateW).toBe(400);
      expect(result.intermediateH).toBe(800);
      expect(result.dx).toBe(0);
      expect(result.dy).toBe(-200);
    });
  });
});

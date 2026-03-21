"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import type {
  EditorState,
  CropBox,
  AspectRatioLock,
  AutoCropConfig,
  ResizeConfig,
  ExportConfig,
  SourceImage,
} from "@/types/editor";
import {
  DEFAULT_QUALITY,
  DEFAULT_THRESHOLD,
  MAX_HISTORY,
  MIN_CROP_SIZE,
} from "@/types/editor";
import { cropToCanvas, canvasToBlob, downloadBlob } from "@/lib/image-export";

// 需要被 Undo/Redo 追蹤的狀態子集
type TemporalState = Pick<
  EditorState,
  "mode" | "cropBox" | "zoom" | "aspectRatio" | "autoCropConfig" | "resizeConfig"
>;

const defaultExportConfig: ExportConfig = {
  format: "image/png",
  quality: DEFAULT_QUALITY,
};

const defaultAspectRatio: AspectRatioLock = {
  preset: "free",
  ratio: null,
};

const defaultAutoCropConfig: AutoCropConfig = {
  thresholdPercent: DEFAULT_THRESHOLD,
};

function createDefaultCropBox(w: number, h: number): CropBox {
  return { x: 0, y: 0, width: w, height: h };
}

// 使用 temporal + immer 建立有 Undo/Redo 功能的 store
export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set, get) => ({
      source: null,
      mode: "crop",
      cropBox: null,
      zoom: 1,
      aspectRatio: defaultAspectRatio,
      autoCropConfig: defaultAutoCropConfig,
      resizeConfig: null,
      exportConfig: defaultExportConfig,
      isProcessing: false,

      loadImage: async (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = objectUrl;
        });

        const mimeType = file.type as SourceImage["mimeType"];
        const source: SourceImage = {
          objectUrl,
          fileName: file.name,
          mimeType,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };

        const cropBox = createDefaultCropBox(img.naturalWidth, img.naturalHeight);

        set((state) => {
          // 釋放舊的 objectUrl
          if (state.source?.objectUrl) {
            URL.revokeObjectURL(state.source.objectUrl);
          }
          state.source = source;
          state.mode = "crop";
          state.cropBox = cropBox;
          state.zoom = 1;
          state.aspectRatio = defaultAspectRatio;
          state.autoCropConfig = defaultAutoCropConfig;
          state.resizeConfig = {
            targetWidth: img.naturalWidth,
            targetHeight: img.naturalHeight,
            fittingStrategy: "contain",
            bgColor: "transparent",
          };
          state.exportConfig = {
            format: mimeType,
            quality: DEFAULT_QUALITY,
          };
        });

        // 重新上傳時清空 Undo/Redo 歷史
        useEditorStore.temporal.getState().clear();
      },

      setMode: (mode) => {
        set((state) => {
          state.mode = mode;
        });
      },

      // 裁切完成後記錄歷史快照
      setCropBox: (box: CropBox) => {
        const validated: CropBox = {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.max(MIN_CROP_SIZE, box.width),
          height: Math.max(MIN_CROP_SIZE, box.height),
        };
        set((state) => {
          state.cropBox = validated;
        });
      },

      // 拖動中間幀：更新 UI 但不記錄歷史
      updateCropBoxPreview: (box: CropBox) => {
        // 使用 temporal 的 pause/resume 避免記錄中間幀
        useEditorStore.temporal.getState().pause();
        set((state) => {
          state.cropBox = box;
        });
        useEditorStore.temporal.getState().resume();
      },

      setZoom: (zoom) => {
        set((state) => {
          state.zoom = zoom;
        });
      },

      setAspectRatio: (lock: AspectRatioLock) => {
        set((state) => {
          state.aspectRatio = lock;
        });
      },

      setAutoCropConfig: (config: AutoCropConfig) => {
        set((state) => {
          state.autoCropConfig = config;
        });
      },

      runAutoCrop: async () => {
        const { source, autoCropConfig } = get();
        if (!source) return;

        set((state) => {
          state.isProcessing = true;
        });

        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = source.objectUrl;
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("無法取得 2D context");
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const { findCropBox } = await import("@/lib/auto-crop");
          const cropBox = findCropBox(imageData, autoCropConfig.thresholdPercent);

          // 全圖皆為背景時，cropBox 覆蓋全圖，toast 由元件層處理
          const isAllBackground =
            cropBox.x === 0 &&
            cropBox.y === 0 &&
            cropBox.width === source.naturalWidth &&
            cropBox.height === source.naturalHeight;

          if (!isAllBackground) {
            get().setCropBox(cropBox);
          }

          set((state) => {
            state.isProcessing = false;
          });

          return isAllBackground ? Promise.reject(new Error("all-background")) : undefined;
        } catch (err) {
          set((state) => {
            state.isProcessing = false;
          });
          throw err;
        }
      },

      setResizeConfig: (config: Partial<ResizeConfig>) => {
        set((state) => {
          if (state.resizeConfig) {
            Object.assign(state.resizeConfig, config);
          }
        });
      },

      setExportConfig: (config: Partial<ExportConfig>) => {
        set((state) => {
          Object.assign(state.exportConfig, config);
        });
      },

      exportImage: async () => {
        const { source, cropBox, mode, resizeConfig, exportConfig } = get();
        if (!source) return;

        set((state) => {
          state.isProcessing = true;
        });

        try {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = source.objectUrl;
          });

          const box = cropBox ?? createDefaultCropBox(source.naturalWidth, source.naturalHeight);
          let canvas = cropToCanvas(img, box);

          if (mode === "resize" && resizeConfig) {
            const { resizeImage } = await import("@/lib/resize");
            // JPEG 不支援透明，自動改為白色
            const effectiveBgColor =
              exportConfig.format === "image/jpeg" && resizeConfig.bgColor === "transparent"
                ? "#ffffff"
                : resizeConfig.bgColor;
            canvas = await resizeImage(canvas, {
              ...resizeConfig,
              bgColor: effectiveBgColor,
            });
          }

          const blob = await canvasToBlob(canvas, exportConfig.format, exportConfig.quality);
          downloadBlob(blob, source.fileName, exportConfig.format);
        } finally {
          set((state) => {
            state.isProcessing = false;
          });
        }
      },
    })),
    {
      partialize: (state): TemporalState => ({
        mode: state.mode,
        cropBox: state.cropBox,
        zoom: state.zoom,
        aspectRatio: state.aspectRatio,
        autoCropConfig: state.autoCropConfig,
        resizeConfig: state.resizeConfig,
      }),
      limit: MAX_HISTORY,
    }
  )
);

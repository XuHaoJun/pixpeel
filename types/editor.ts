// T007: 全域 TypeScript 型別定義

export type EditorMode = "crop" | "resize";

export type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

export type FittingStrategy = "contain" | "cover" | "fill";

export type AspectRatioPreset =
  | "free"
  | "1:1"
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16";

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SourceImage {
  objectUrl: string;
  fileName: string;
  mimeType: OutputFormat;
  naturalWidth: number;
  naturalHeight: number;
}

export interface AspectRatioLock {
  preset: AspectRatioPreset;
  ratio: number | null;
}

export interface AutoCropConfig {
  thresholdPercent: number;
}

export interface ResizeConfig {
  targetWidth: number;
  targetHeight: number;
  fittingStrategy: FittingStrategy;
  bgColor: string;
}

export interface ExportConfig {
  format: OutputFormat;
  quality: number;
}

export interface EditorState {
  source: SourceImage | null;
  mode: EditorMode;
  cropBox: CropBox | null;
  zoom: number;
  aspectRatio: AspectRatioLock;
  autoCropConfig: AutoCropConfig;
  resizeConfig: ResizeConfig | null;
  exportConfig: ExportConfig;
  isProcessing: boolean;

  loadImage: (file: File) => Promise<void>;
  setMode: (mode: EditorMode) => void;
  setCropBox: (box: CropBox) => void;
  updateCropBoxPreview: (box: CropBox) => void;
  setZoom: (zoom: number) => void;
  setAspectRatio: (lock: AspectRatioLock) => void;
  setAutoCropConfig: (config: AutoCropConfig) => void;
  runAutoCrop: () => Promise<void>;
  setResizeConfig: (config: Partial<ResizeConfig>) => void;
  setExportConfig: (config: Partial<ExportConfig>) => void;
  exportImage: () => Promise<void>;
}

// 常數
export const MIN_CROP_SIZE = 10;
export const DEFAULT_QUALITY = 0.92;
export const MAX_HISTORY = 50;
export const DEFAULT_THRESHOLD = 5;

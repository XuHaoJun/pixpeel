# 資料模型：圖片裁切與縮放編輯器

**功能分支**: `001-image-crop-resize`
**建立日期**: 2026-03-22

---

## 核心型別定義

### EditorMode — 編輯器模式

```ts
type EditorMode = 'crop' | 'resize'
```

- `'crop'`：預設模式，顯示裁切框與裁切工具面板
- `'resize'`：縮放模式，顯示尺寸輸入與適配策略面板

---

### SourceImage — 原始圖片

```ts
interface SourceImage {
  /** 用於顯示的 Object URL（from URL.createObjectURL） */
  objectUrl: string
  /** 原始檔案名稱（用於預設輸出格式推斷） */
  fileName: string
  /** 原始 MIME type（'image/jpeg' | 'image/png' | 'image/webp'） */
  mimeType: OutputFormat
  /** 原始圖片像素寬度 */
  naturalWidth: number
  /** 原始圖片像素高度 */
  naturalHeight: number
}
```

**驗證規則**：
- `mimeType` 必須為 `'image/jpeg' | 'image/png' | 'image/webp'`
- `naturalWidth > 0`，`naturalHeight > 0`

---

### CropBox — 裁切框

```ts
interface CropBox {
  /** 裁切區域左上角 X 座標（像素，相對於原始圖片） */
  x: number
  /** 裁切區域左上角 Y 座標（像素，相對於原始圖片） */
  y: number
  /** 裁切區域寬度（像素） */
  width: number
  /** 裁切區域高度（像素） */
  height: number
}
```

**驗證規則**：
- `x >= 0`，`y >= 0`
- `width >= MIN_CROP_SIZE`（最小值 = 10 像素）
- `height >= MIN_CROP_SIZE`
- `x + width <= sourceImage.naturalWidth`
- `y + height <= sourceImage.naturalHeight`

**初始值**：覆蓋整張圖片 `{ x: 0, y: 0, width: naturalWidth, height: naturalHeight }`

---

### AspectRatioLock — 長寬比鎖定

```ts
type AspectRatioPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | 'custom'

interface AspectRatioLock {
  preset: AspectRatioPreset
  /** 鎖定時的長寬比值（width / height）；preset 為 'free' 時為 null */
  ratio: number | null
}
```

---

### AutoCropConfig — 自動裁切設定

```ts
interface AutoCropConfig {
  /** 容差百分比（0–100）；預設 5 */
  thresholdPercent: number
}
```

**驗證規則**：`thresholdPercent` 範圍 `[0, 100]`

---

### FittingStrategy — 縮放適配策略

```ts
type FittingStrategy = 'contain' | 'cover' | 'fill'
```

| 值 | 行為 | CSS 對應 |
|----|------|---------|
| `'contain'` | 等比例縮放，完整顯示，空白填滿 | `object-fit: contain` |
| `'cover'` | 等比例縮放，填滿目標，居中裁切超出部分 | `object-fit: cover` |
| `'fill'` | 強制填滿，不保持長寬比（可能變形） | `object-fit: fill` |

---

### ResizeConfig — 縮放設定

```ts
interface ResizeConfig {
  /** 目標寬度（像素，正整數） */
  targetWidth: number
  /** 目標高度（像素，正整數） */
  targetHeight: number
  /** 適配策略 */
  fittingStrategy: FittingStrategy
  /** Contain 策略的背景填滿顏色（CSS hex 或 'transparent'） */
  bgColor: string
}
```

**驗證規則**：
- `targetWidth >= 1`（正整數）
- `targetHeight >= 1`（正整數）
- `bgColor`：合法 CSS 顏色字串或 `'transparent'`

**初始值**：
```ts
{
  targetWidth: sourceImage.naturalWidth,
  targetHeight: sourceImage.naturalHeight,
  fittingStrategy: 'contain',
  bgColor: 'transparent'
}
```

---

### OutputFormat — 輸出格式

```ts
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp'
```

---

### ExportConfig — 匯出設定

```ts
interface ExportConfig {
  /** 輸出格式；預設跟隨輸入圖片格式 */
  format: OutputFormat
  /** JPEG/WebP 品質（0.0–1.0）；PNG 忽略此值 */
  quality: number
}
```

**驗證規則**：`quality` 範圍 `[0, 1]`；預設 `0.92`

---

### EditorState — 全域編輯器狀態（Zustand Store）

```ts
interface EditorState {
  // 資料
  source: SourceImage | null
  mode: EditorMode
  cropBox: CropBox | null
  zoom: number              // react-easy-crop 的縮放比例；初始 1
  rotation: number          // 預留欄位（目前不實作旋轉）；初始 0
  aspectRatio: AspectRatioLock
  autoCropConfig: AutoCropConfig
  resizeConfig: ResizeConfig | null
  exportConfig: ExportConfig

  // 衍生狀態（不進入 Undo 歷史）
  isProcessing: boolean     // 正在執行 pica resize 或 auto-crop 計算

  // Actions
  loadImage: (file: File) => Promise<void>
  setMode: (mode: EditorMode) => void
  setCropBox: (box: CropBox) => void          // onCropComplete 時呼叫（記錄歷史）
  updateCropBoxPreview: (box: CropBox) => void // onCropChange 時呼叫（不記錄歷史）
  setZoom: (zoom: number) => void
  setAspectRatio: (lock: AspectRatioLock) => void
  setAutoCropConfig: (config: AutoCropConfig) => void
  runAutoCrop: () => Promise<void>
  setResizeConfig: (config: Partial<ResizeConfig>) => void
  setExportConfig: (config: Partial<ExportConfig>) => void
  exportImage: () => Promise<void>
}
```

**Undo/Redo 追蹤範圍（zundo partialize）**：
僅快照以下欄位（排除 `isProcessing`、`source`、`exportConfig`）：
```ts
{
  mode, cropBox, zoom, aspectRatio, autoCropConfig, resizeConfig
}
```

---

## 狀態生命週期

```
初始狀態
  └─ source = null, mode = 'crop'
       │
       ▼ loadImage(file)
  圖片已載入
  └─ source = { objectUrl, fileName, mimeType, naturalWidth, naturalHeight }
  └─ cropBox = { x:0, y:0, width:naturalWidth, height:naturalHeight }
  └─ resizeConfig = { targetWidth:naturalWidth, targetHeight:naturalHeight, ... }
       │
       ▼ 使用者操作（拖動裁切框 / 設定縮放）
  編輯中
  └─ onCropChange → updateCropBoxPreview (UI 即時更新，不記錄歷史)
  └─ onCropComplete → setCropBox (記錄歷史快照)
  └─ setMode('resize') → 記錄歷史快照
       │
       ▼ exportImage()
  處理中 (isProcessing = true)
  └─ 對 cropBox 內容執行 pica resize (若在 resize mode)
  └─ canvas.toBlob() → download
  └─ isProcessing = false
```

---

## 常數

```ts
const MIN_CROP_SIZE = 10       // 裁切框最小邊長（像素）
const DEFAULT_QUALITY = 0.92   // 預設 JPEG/WebP 輸出品質
const MAX_HISTORY = 50         // Undo/Redo 最大歷史步數
const DEFAULT_THRESHOLD = 5    // 自動裁切預設容差百分比
```

---

## 函式簽名（lib/ 層）

### lib/auto-crop.ts

```ts
/**
 * 找出圖片中非背景顏色的最小邊界框
 * 移植自 auto-crop-1.js，加入 TypeScript 型別
 *
 * @param imageData - 來自 canvas.getContext('2d').getImageData() 的物件
 * @param thresholdPercent - 容差百分比（0–100）
 * @returns CropBox，若全圖皆為背景則返回覆蓋全圖的 CropBox
 */
export function findCropBox(imageData: ImageData, thresholdPercent: number): CropBox
```

### lib/resize.ts

```ts
/**
 * 使用 pica 對圖片進行高品質縮放，支援三種適配策略
 *
 * @param sourceCanvas - 來源 canvas（已包含裁切後的像素）
 * @param config - 縮放設定（targetWidth, targetHeight, fittingStrategy, bgColor）
 * @returns 縮放後的 HTMLCanvasElement
 */
export async function resizeImage(
  sourceCanvas: HTMLCanvasElement,
  config: ResizeConfig
): Promise<HTMLCanvasElement>

/**
 * 計算三種適配策略的幾何參數
 */
export function computeFitRect(
  srcW: number, srcH: number,
  dstW: number, dstH: number,
  strategy: FittingStrategy
): { intermediateW: number; intermediateH: number; dx: number; dy: number }
```

### lib/image-export.ts

```ts
/**
 * 從 canvas 匯出圖片 Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob>

/**
 * 觸發瀏覽器下載
 */
export function downloadBlob(blob: Blob, fileName: string, format: OutputFormat): void

/**
 * 從來源圖片裁切指定區域，返回 canvas
 */
export function cropToCanvas(
  image: HTMLImageElement,
  cropBox: CropBox
): HTMLCanvasElement
```

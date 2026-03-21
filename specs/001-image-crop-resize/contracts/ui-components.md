# UI 元件介面契約

**功能分支**: `001-image-crop-resize`
**建立日期**: 2026-03-22

本文件定義各 UI 元件的 Props 介面與行為契約，作為實作與測試的依據。

---

## ImageEditor（主容器）

```ts
// components/editor/image-editor.tsx
// 無 props — 從 Zustand store 取得所有狀態

export function ImageEditor(): JSX.Element
```

**責任**：
- 根據 `EditorState.source` 決定顯示「上傳區」或「編輯器」
- 根據 `EditorState.mode` 渲染 `CropMode` 或 `ResizeMode`
- 渲染 `Toolbar`

**狀態流**：消費 `useEditorStore`，不接受 props

---

## Toolbar（工具列）

```ts
// components/editor/toolbar.tsx

interface ToolbarProps {
  /** 當前模式 */
  mode: EditorMode
  /** 切換至裁切模式 */
  onCropMode: () => void
  /** 切換至縮放模式 */
  onResizeMode: () => void
  /** Undo 是否可用 */
  canUndo: boolean
  /** Redo 是否可用 */
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}
```

**元件清單（shadcn）**：
- `Button` × 4：Crop icon、Resize icon、Undo icon、Redo icon
- `Tooltip` × 4：每個 icon button 的標籤

**行為**：
- Undo/Redo button 在 `canUndo`/`canRedo` 為 `false` 時顯示 `disabled`
- 當前模式的 icon button 顯示 active 狀態

---

## CropMode（裁切模式）

```ts
// components/crop/crop-mode.tsx

// 無 props — 從 store 取得狀態
export function CropMode(): JSX.Element
```

**包含**：
- `CropCanvas`：react-easy-crop 包裝器
- `AspectRatioSelector`：長寬比選擇器
- `AutoCropControls`：自動裁切按鈕 + 容差滑桿

---

## CropCanvas

```ts
// components/crop/crop-canvas.tsx
'use client'

interface CropCanvasProps {
  imageSrc: string
  cropBox: CropBox
  zoom: number
  aspectRatio: number | null       // null = 自由裁切
  /** 拖動中（不記錄歷史） */
  onCropChange: (box: CropBox) => void
  /** 放開手把後（記錄歷史快照） */
  onCropComplete: (box: CropBox) => void
  onZoomChange: (zoom: number) => void
}
```

**實作注意**：
- 包裝 `react-easy-crop` 的 `<Cropper>` 元件
- `onCropComplete` 從 react-easy-crop 的 `croppedAreaPixels` 轉換為 `CropBox`

---

## AspectRatioSelector

```ts
// components/crop/aspect-ratio-selector.tsx

interface AspectRatioSelectorProps {
  value: AspectRatioLock
  onChange: (lock: AspectRatioLock) => void
}
```

**元件**：shadcn `ToggleGroup`（one value）

**預設選項**：`free | 1:1 | 4:3 | 3:4 | 16:9 | 9:16`

---

## AutoCropControls

```ts
// components/crop/auto-crop-controls.tsx

interface AutoCropControlsProps {
  config: AutoCropConfig
  isProcessing: boolean
  onConfigChange: (config: AutoCropConfig) => void
  onRunAutoCrop: () => void
}
```

**元件**：
- `Button`：「自動裁切」（`isProcessing` 時顯示 loading spinner）
- `Slider`：容差百分比（0–100），label 顯示當前值

---

## ResizeMode（縮放模式）

```ts
// components/resize/resize-mode.tsx

// 無 props — 從 store 取得狀態
export function ResizeMode(): JSX.Element
```

**包含**：
- `DimensionInputs`：寬高輸入
- `FittingStrategySelector`：策略選擇
- `BackgroundColorPicker`：背景色（僅 Contain 策略顯示）

---

## DimensionInputs

```ts
// components/resize/dimension-inputs.tsx

interface DimensionInputsProps {
  width: number
  height: number
  /** 長寬比是否連動 */
  linked: boolean
  onWidthChange: (w: number) => void
  onHeightChange: (h: number) => void
  onLinkedChange: (linked: boolean) => void
}
```

**元件**：shadcn `Input`（type="number", min=1）× 2 + 連動 toggle `Button`

**驗證**：輸入值必須為正整數；若非法，欄位顯示 error state，並阻止更新 store

---

## FittingStrategySelector

```ts
// components/resize/fitting-strategy-selector.tsx

interface FittingStrategySelectorProps {
  value: FittingStrategy
  onChange: (strategy: FittingStrategy) => void
}
```

**元件**：shadcn `ToggleGroup`（one value）

**選項**：`contain | cover | fill`，各附說明文字

---

## BackgroundColorPicker

```ts
// components/resize/background-color-picker.tsx

interface BackgroundColorPickerProps {
  /** CSS 顏色字串或 'transparent' */
  color: string
  onChange: (color: string) => void
  /** 當 format 為 'image/jpeg' 時，顯示提示：「JPEG 不支援透明，將自動填白」 */
  format: OutputFormat
}
```

**元件**：
- `Popover`（shadcn）觸發顏色選擇
- `HexColorPicker`（react-colorful）
- `Button` 顯示透明選項
- 當 `color === 'transparent' && format === 'image/jpeg'` 時顯示警告文字

---

## ExportPanel（匯出面板）

```ts
// components/editor/export-panel.tsx

interface ExportPanelProps {
  exportConfig: ExportConfig
  isProcessing: boolean
  onExportConfigChange: (config: Partial<ExportConfig>) => void
  onExport: () => void
}
```

**元件**：
- `Select`（shadcn）：PNG / JPEG / WebP 格式選擇
- `Slider`（shadcn）：JPEG/WebP 品質（0–100），PNG 時隱藏
- `Button`：「下載」（`isProcessing` 時顯示 loading）

---

## ImageUploader（上傳區）

```ts
// components/editor/image-uploader.tsx

interface ImageUploaderProps {
  onFileSelect: (file: File) => void
}
```

**行為**：
- 支援點擊選擇檔案（`<input type="file" accept="image/jpeg,image/png,image/webp">`）
- 支援拖曳上傳
- 格式錯誤時顯示 error toast

---

## 錯誤與通知

統一使用 **Sonner**（shadcn/ui 推薦，取代 `toast`）：

```bash
npx shadcn@latest add sonner
```

**toast 事件**：
| 事件 | 類型 | 訊息 |
|------|------|------|
| 上傳不支援格式 | error | 「不支援此格式，請上傳 JPEG、PNG 或 WebP」 |
| 自動裁切無法偵測主體 | warning | 「無法偵測到非背景內容，請調整容差或手動裁切」 |
| 尺寸輸入無效 | error | 「請輸入有效的正整數尺寸」 |
| 匯出成功 | success | 「圖片已下載」 |

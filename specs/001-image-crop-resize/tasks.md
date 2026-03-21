---

description: "Task list for 圖片裁切與縮放編輯器"
---

# Tasks: 圖片裁切與縮放編輯器

**Input**: Design documents from `/specs/001-image-crop-resize/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-components.md ✅

> **注意**：依據 Pixpeel 憲法原則 II（測試驅動開發，不可妥協），測試任務必須在實作任務之前完成。每個用戶故事的測試必須先失敗（紅燈），再實作讓其通過（綠燈）。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無相互依賴）
- **[Story]**: 所屬用戶故事（US1, US2, US3）
- 所有描述包含精確檔案路徑

---

## Phase 1: Setup（專案初始化）

**目的**: 建立 Next.js 16 專案基礎與安裝所有依賴

- [ ] T001 用 `npx create-next-app@latest pixpeel --typescript --app` 建立 Next.js 16 + TypeScript + App Router 專案
- [ ] T002 [P] 用 `npx shadcn@latest init -t next` 初始化 shadcn/ui（new-york style, Tailwind v4 自動偵測）
- [ ] T003 [P] 安裝執行期套件：`npm install react-easy-crop pica zustand zundo immer react-colorful sonner`
- [ ] T004 用 shadcn CLI 新增元件：`npx shadcn@latest add button slider select input popover tooltip toggle-group sonner`
- [ ] T005 [P] 配置 Vitest + React Testing Library：`npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom`，建立 `vitest.config.ts`
- [ ] T006 [P] 配置 Playwright E2E：`npm install -D @playwright/test`，建立 `playwright.config.ts`，target `http://localhost:3000`

---

## Phase 2: Foundational（基礎架構，阻塞所有用戶故事）

**目的**: 建立共用型別、狀態管理、圖片處理基礎層

**⚠️ 所有用戶故事開始前必須完成此階段**

- [ ] T007 定義全部 TypeScript 型別於 `types/editor.ts`（`EditorMode`, `SourceImage`, `CropBox`, `AspectRatioLock`, `AutoCropConfig`, `FittingStrategy`, `ResizeConfig`, `OutputFormat`, `ExportConfig`, `EditorState`, 常數 `MIN_CROP_SIZE`, `DEFAULT_QUALITY`, `MAX_HISTORY`, `DEFAULT_THRESHOLD`）
- [ ] T008 [P] 建立 `lib/empty.ts`（空模組，供 turbopack resolveAlias 使用：`export default {}`）
- [ ] T009 [P] 配置 `next.config.ts`（加入 `turbopack.resolveAlias` 將 `fs`、`path` 指向 `lib/empty.ts`）
- [ ] T010 實作 `hooks/use-editor-store.ts`（Zustand + zundo + immer store，包含：`source`, `mode`, `cropBox`, `zoom`, `aspectRatio`, `autoCropConfig`, `resizeConfig`, `exportConfig`, `isProcessing`；actions：`loadImage`, `setMode`, `setCropBox`, `updateCropBoxPreview`, `setZoom`, `setAspectRatio`, `setExportConfig`；zundo `partialize` 只追蹤 `mode/cropBox/zoom/aspectRatio/autoCropConfig/resizeConfig`，`limit: 50`）
- [ ] T011 [P] 實作 `lib/image-export.ts`（`cropToCanvas(image, cropBox): HTMLCanvasElement`、`canvasToBlob(canvas, format, quality): Promise<Blob>`、`downloadBlob(blob, fileName, format): void`）
- [ ] T012 實作 `components/editor/image-uploader.tsx`（`'use client'`，支援 `<input type="file" accept="image/jpeg,image/png,image/webp">`點擊與拖曳上傳；格式錯誤時呼叫 `sonner.toast.error`；成功時呼叫 `store.loadImage`）
- [ ] T013 實作 `components/editor/image-editor.tsx`（`'use client'`，根據 `source` 是否為 null 顯示 `ImageUploader` 或編輯器主體；編輯器主體結構：Toolbar + 模式容器 + ExportPanel）
- [ ] T014 [P] 設定 `app/layout.tsx`（加入 `<Toaster />` from sonner, metadata title="Pixpeel"）
- [ ] T015 [P] 設定 `app/page.tsx`（渲染 `<ImageEditor />`，全版面居中）

**Checkpoint**: 基礎架構就緒，可開始各用戶故事實作

---

## Phase 3: 用戶故事 1 - 手動裁切圖片（優先級：P1）🎯 MVP

**目標**: 使用者可上傳圖片 → 拖動裁切框 → 下載裁切結果

**獨立測試**: 上傳圖片 → 拖動裁切框角落 → 點擊下載 → 確認輸出尺寸等於裁切框 width × height

### 測試（先寫測試，確認失敗後再實作）

- [ ] T016 [P] [US1] 在 `tests/unit/image-export.test.ts` 撰寫 `cropToCanvas` 的單元測試（測試裁切座標正確對應到輸出 canvas 尺寸）
- [ ] T017 [P] [US1] 在 `tests/components/crop-canvas.test.tsx` 撰寫 `CropCanvas` 的元件測試（測試 `onCropComplete` 在放開手把後被呼叫，並傳入正確的 `CropBox`）
- [ ] T018 [P] [US1] 在 `tests/components/toolbar.test.tsx` 撰寫 `Toolbar` 的元件測試（測試：Undo button 在 `canUndo=false` 時顯示 disabled；Redo button 在 `canRedo=false` 時顯示 disabled；點擊 Resize icon 觸發 `onResizeMode`）
- [ ] T019 [US1] 在 `tests/e2e/crop.spec.ts` 撰寫 P1 完整流程 E2E 測試（上傳圖片 → 裁切框存在 → 拖動裁切框 → 點擊下載 → 驗證下載觸發）

### 實作

- [ ] T020 [P] [US1] 實作 `components/crop/crop-canvas.tsx`（`'use client'`，包裝 `react-easy-crop` `<Cropper>`；`onCropChange` 呼叫 `store.updateCropBoxPreview`；`onCropComplete` 呼叫 `store.setCropBox`，傳入 `croppedAreaPixels`）
- [ ] T021 [P] [US1] 實作 `components/crop/aspect-ratio-selector.tsx`（shadcn `ToggleGroup` one value；選項：`free | 1:1 | 4:3 | 3:4 | 16:9 | 9:16`；onChange 呼叫 `store.setAspectRatio`）
- [ ] T022 [US1] 實作 `components/crop/crop-mode.tsx`（組合 `CropCanvas` + `AspectRatioSelector`，從 store 取得 `imageSrc`, `cropBox`, `zoom`, `aspectRatio`）
- [ ] T023 [US1] 實作 `components/editor/toolbar.tsx`（shadcn `Button` × 4：Crop icon, Resize icon, Undo icon, Redo icon；shadcn `Tooltip` × 4；Undo/Redo 依 `canUndo`/`canRedo` 顯示 disabled；高亮當前 mode；鍵盤快捷鍵監聽器 `Ctrl+Z → undo`、`Ctrl+Y → redo`）
- [ ] T024 [US1] 實作 `components/editor/export-panel.tsx`（shadcn `Select` for format PNG/JPEG/WebP 預設跟隨輸入格式；shadcn `Slider` for quality 0–100 僅 JPEG/WebP 顯示；shadcn `Button` 下載；`isProcessing` 時顯示 loading）
- [ ] T025 [US1] 將 US1 完整串接進 `components/editor/image-editor.tsx`（渲染 Toolbar + CropMode + ExportPanel；ExportPanel `onExport` 呼叫 `cropToCanvas` → `canvasToBlob` → `downloadBlob`）

**Checkpoint**: 上傳圖片 → 裁切 → 下載完整流程可獨立演示與測試，Undo/Redo 工作正常

---

## Phase 4: 用戶故事 2 - 自動裁切（優先級：P2）

**目標**: 使用者可一鍵觸發自動裁切，系統自動偵測非背景主體邊界

**獨立測試**: 上傳白邊截圖 → 點擊「自動裁切」→ 裁切框自動收縮至主體邊界；調整容差滑桿 → 裁切框即時更新

### 測試（先寫測試，確認失敗後再實作）

- [ ] T026 [P] [US2] 在 `tests/unit/auto-crop.test.ts` 撰寫 `findCropBox` 的單元測試（測試情境：全白圖片返回全圖尺寸、四周白邊圖片返回正確邊界、不同 thresholdPercent 影響邊界寬鬆度）
- [ ] T027 [US2] 在 `tests/e2e/auto-crop.spec.ts` 撰寫 P2 完整流程 E2E 測試（上傳有白邊圖片 → 點擊自動裁切 → 驗證裁切框縮小；上傳全白圖片 → 點擊自動裁切 → 驗證警告 toast 出現）

### 實作

- [ ] T028 [US2] 實作 `lib/auto-crop.ts`（TypeScript 移植 `auto-crop-1.js` 的 `findCropBoxJS`，函式簽名：`findCropBox(imageData: ImageData, thresholdPercent: number): CropBox`，算法完全相同，加入型別標註）
- [ ] T029 [US2] 在 `hooks/use-editor-store.ts` 新增 `runAutoCrop` action（將當前圖片繪製到 offscreen canvas → 呼叫 `getImageData` → 呼叫 `findCropBox` → 若返回全圖尺寸則呼叫 `sonner.toast.warning` → 否則呼叫 `setCropBox` 更新裁切框）、`setAutoCropConfig` action
- [ ] T030 [US2] 實作 `components/crop/auto-crop-controls.tsx`（shadcn `Button` 「自動裁切」，`isProcessing` 時顯示 spinner；shadcn `Slider` 容差 0–100，顯示當前值，`onValueChange` 呼叫 `setAutoCropConfig` 並即時觸發 `runAutoCrop`）
- [ ] T031 [US2] 將 `AutoCropControls` 整合進 `components/crop/crop-mode.tsx`

**Checkpoint**: 自動裁切可獨立演示，手動調整容差即時生效，警告 toast 正確觸發

---

## Phase 5: 用戶故事 3 - 調整圖片尺寸（優先級：P3）

**目標**: 使用者可切換至縮放模式，選擇三種適配策略（Contain / Cover / Fill），輸出精確目標尺寸的圖片

**獨立測試**: 不裁切直接點擊 Resize icon → 輸入 400×400 → 分別選三種策略下載 → 驗證輸出尺寸精確且視覺行為正確

### 測試（先寫測試，確認失敗後再實作）

- [ ] T032 [P] [US3] 在 `tests/unit/resize.test.ts` 撰寫 `computeFitRect` 的單元測試（測試 contain/cover/fill 三種策略的幾何計算，包含橫向圖、直向圖、正方形圖三種 srcW/srcH 組合）
- [ ] T033 [P] [US3] 在 `tests/components/fitting-strategy-selector.test.tsx` 撰寫元件測試（測試三個策略選項均可點選，選中後 onChange 被呼叫）
- [ ] T034 [US3] 在 `tests/e2e/resize.spec.ts` 撰寫 P3 完整流程 E2E 測試（上傳圖片 → 點擊 Resize icon → 輸入 400×400 → 分別選 contain/cover/fill 並下載 → 驗證輸出圖片尺寸為 400×400）

### 實作

- [ ] T035 [US3] 實作 `lib/resize.ts`（`computeFitRect(srcW, srcH, dstW, dstH, strategy): { intermediateW, intermediateH, dx, dy }`；`resizeImage(sourceCanvas, config): Promise<HTMLCanvasElement>`：內部動態 import pica，contain 策略時將 intermediate canvas 合成到背景色 dst canvas，cover 策略居中裁切，fill 直接 resize；JPEG 輸出時 `bgColor` 自動退回白色）
- [ ] T036 [P] [US3] 實作 `components/resize/dimension-inputs.tsx`（shadcn `Input` type=number min=1 × 2 for width/height；連動 toggle Button（鎖頭 icon）啟用時修改寬/高會等比連動另一邊；無效輸入顯示 error state 且不更新 store）
- [ ] T037 [P] [US3] 實作 `components/resize/fitting-strategy-selector.tsx`（shadcn `ToggleGroup` one value；三個選項：Contain / Cover / Fill，各附中文說明文字；onChange 呼叫 `store.setResizeConfig`）
- [ ] T038 [P] [US3] 實作 `components/resize/background-color-picker.tsx`（shadcn `Popover` + `react-colorful` `HexColorPicker`；提供「透明」Button；當 `format='image/jpeg'` 且 `color='transparent'` 時顯示警告文字「JPEG 不支援透明，將自動填白」）
- [ ] T039 [US3] 實作 `components/resize/resize-mode.tsx`（組合 `DimensionInputs` + `FittingStrategySelector` + `BackgroundColorPicker`（僅 Contain 策略顯示）；從 store 取得 `resizeConfig`）
- [ ] T040 [US3] 在 `hooks/use-editor-store.ts` 新增 `setResizeConfig` action 與 ResizeMode 下的 `exportImage` 邏輯（`cropToCanvas` 取裁切結果 → `resizeImage` → `canvasToBlob` → `downloadBlob`）
- [ ] T041 [US3] 將 `ResizeMode` 串接進 `components/editor/image-editor.tsx`（mode='resize' 時渲染 `ResizeMode` 取代 `CropMode`；`ExportPanel` 的 `onExport` 根據當前 mode 選擇對應的輸出路徑）

**Checkpoint**: 三個用戶故事均可獨立演示，串聯流程（裁切 → 縮放）完整可用

---

## Phase N: Polish 與橫切關注

**目的**: 文件、測試收斂、跨瀏覽器驗證

- [ ] T042 [P] 撰寫 `README.md`（專案說明、功能截圖佔位、安裝步驟、Vercel Deploy Button `[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2Fpixpeel&project-name=pixpeel&repository-name=pixpeel)` 替換 YOUR_ORG 後正式填入）
- [ ] T043 [P] 在 `tests/unit/image-export.test.ts` 補充 `canvasToBlob` 與 `downloadBlob` 的單元測試
- [ ] T044 執行全部單元測試並修正失敗：`npm run test`
- [ ] T045 執行全部元件測試並修正失敗：`npm run test:components`
- [ ] T046 啟動 dev server 並執行 Playwright E2E 測試：`npm run dev` + `npm run test:e2e`
- [ ] T047 依照 `specs/001-image-crop-resize/quickstart.md` 手動驗證三個用戶故事與 Undo/Redo 完整流程

---

## Dependencies & Execution Order

### Phase 依賴關係

- **Phase 1（Setup）**: 無依賴，可立即開始
- **Phase 2（Foundational）**: 依賴 Phase 1 完成 ⛔ 阻塞所有用戶故事
- **US1（Phase 3）**: 依賴 Phase 2 完成
- **US2（Phase 4）**: 依賴 US1 完成（AutoCropControls 整合進 CropMode）
- **US3（Phase 5）**: 依賴 Phase 2 完成（與 US1/US2 可並行，但 export 流程需要 US1 的 ExportPanel）
- **Polish（Phase N）**: 依賴所有 US 完成

### 各用戶故事內部依賴

- **US1**: Tests（T016–T019）→ 確認失敗 → 實作（T020–T025），其中 T020/T021 可並行，T022 依賴 T020+T021，T023/T024/T025 依賴 T022
- **US2**: Tests（T026–T027）→ 確認失敗 → 實作（T028–T031 依序），T031 依賴 T030
- **US3**: Tests（T032–T034）→ 確認失敗 → 實作（T035 先完成）→ T036/T037/T038 可並行 → T039 依賴 T036+T037+T038 → T040 依賴 T035 → T041 依賴 T039+T040

---

## Parallel Example: US1 測試階段

```bash
# 同時撰寫三個獨立測試檔（不同檔案，無依賴）：
Task: "T016 撰寫 cropToCanvas 單元測試 in tests/unit/image-export.test.ts"
Task: "T017 撰寫 CropCanvas 元件測試 in tests/components/crop-canvas.test.tsx"
Task: "T018 撰寫 Toolbar 元件測試 in tests/components/toolbar.test.tsx"

# 同時實作兩個獨立元件（不同檔案，無依賴）：
Task: "T020 實作 CropCanvas in components/crop/crop-canvas.tsx"
Task: "T021 實作 AspectRatioSelector in components/crop/aspect-ratio-selector.tsx"
```

## Parallel Example: US3 實作階段

```bash
# T035 完成後，以下三個元件可並行實作：
Task: "T036 實作 DimensionInputs in components/resize/dimension-inputs.tsx"
Task: "T037 實作 FittingStrategySelector in components/resize/fitting-strategy-selector.tsx"
Task: "T038 實作 BackgroundColorPicker in components/resize/background-color-picker.tsx"
```

---

## Implementation Strategy

### MVP First（僅 US1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（⚠️ 必須先完成）
3. 完成 Phase 3: US1（先寫測試 → 確認失敗 → 實作）
4. **停止驗證**: 手動執行 quickstart.md P1 測試場景
5. 部署至 Vercel 確認可正常運作

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. US1（T016–T025）→ 獨立測試 → 部署（MVP！）
3. US2（T026–T031）→ 獨立測試 → 部署
4. US3（T032–T041）→ 獨立測試 → 部署
5. Polish（T042–T047）→ 正式發布

---

## Notes

- [P] 任務 = 不同檔案、無相互依賴，可並行執行
- [Story] 標籤對應 spec.md 的用戶故事，確保可追溯性
- **TDD 強制**：依憲法原則 II，每個故事的測試任務必須在對應實作任務開始前完成，且須確認測試為失敗狀態（紅燈）
- shadcn 元件嚴禁手動撰寫，必須透過 `npx shadcn@latest add` 新增
- `pica` 必須使用動態 import（`await import('pica')`），不可靜態 import
- Commit after each checkpoint or logical group
- 每個 Checkpoint 均可獨立演示對應的用戶故事

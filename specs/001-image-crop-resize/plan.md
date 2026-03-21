# Implementation Plan: 圖片裁切與縮放編輯器

**Branch**: `001-image-crop-resize` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-image-crop-resize/spec.md`

## Summary

建立一個 Pintura 風格的純前端圖片編輯器，提供手動裁切（含長寬比鎖定）、自動裁切（`findCropBox` 算法）、以及三種適配策略的縮放（Contain / Cover / Fill）功能。採用 Next.js 16 App Router + TailwindCSS v4 + shadcn/ui，使用 `react-easy-crop` 作為裁切 UI，`pica`（Lanczos3 插值）作為縮放引擎，`zustand + zundo` 實現完整的 Undo/Redo 歷史。部署至 Vercel，README 含 Deploy Button。

## Technical Context

**Language/Version**: TypeScript 5.1+ / Node.js 20.9+
**Primary Dependencies**:
- Next.js 16 (App Router, Turbopack)
- React 19.2
- TailwindCSS v4 + shadcn/ui (new-york style)
- `react-easy-crop` v5.5.6（裁切 UI，`croppedAreaPixels` 輸出）
- `pica` v9.0.1（瀏覽器端 Lanczos3 縮放，dynamic import 避免 SSR）
- `zustand` + `zundo` + `immer`（狀態管理 + Undo/Redo）
- `react-colorful`（顏色選擇器）
- `sonner`（toast 通知）

**Storage**: N/A（無伺服器，無持久化，純瀏覽器 session）

**Testing**:
- Vitest（單元測試）
- React Testing Library（元件測試）
- Playwright（E2E）

**Target Platform**: 現代桌面瀏覽器（Chrome 111+、Firefox 111+、Safari 16.4+），Vercel CDN

**Project Type**: Web application（單頁圖片編輯器）

**Performance Goals**:
- 裁切/縮放操作（5MB 圖片）< 3 秒（SC-005）
- 模式切換回應 < 300ms（SC-007）
- 裁切框拖動回應：即時（< 16ms per frame）

**Constraints**:
- 所有圖片處理 MUST 在瀏覽器客戶端完成（無後端）
- `pica` MUST 使用動態 import（避免 Next.js 16 SSR 拋出 `window is not defined`）
- shadcn 元件 MUST 透過 CLI 新增，禁止手動撰寫

**Scale/Scope**: 單一使用者，每次 session 處理一張圖片，無批次處理需求

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 檢查項目 | 狀態 | 說明 |
|------|---------|------|------|
| I. 品質優先 | TypeScript strict mode、命名自我描述 | ✅ PASS | 全程 TypeScript，型別定義在 `types/editor.ts` |
| II. 測試驅動 | 每個 US 有驗收測試，單元測試涵蓋業務邏輯 | ✅ PASS | Vitest + RTL + Playwright；`lib/auto-crop.ts`、`lib/resize.ts` 需完整單元測試 |
| III. MVP 優先 | P1 可獨立交付，不依賴 P2/P3 | ✅ PASS | P1 = 手動裁切 + 下載，獨立可演示 |
| IV. 簡約設計 | 無不必要抽象，每個依賴有明確理由 | ✅ PASS | 6 個核心套件，各有明確用途；無後端 |
| V. 獨立可測試 | 每個 US 有「獨立測試」說明 | ✅ PASS | 三個 US 各有獨立測試方式（見 spec.md） |

**Constitution Check Post-Design（Phase 1 後）**：

| 原則 | 複查項目 | 狀態 |
|------|---------|------|
| IV. 簡約設計 | `pica` 需 dynamic import 帶來少量複雜度 | ✅ 已記錄，必要的技術約束 |
| IV. 簡約設計 | zundo middleware 取代手動 history | ✅ 比手動實作更簡單，無違反 |

## Project Structure

### Documentation (this feature)

```text
specs/001-image-crop-resize/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-components.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
pixpeel/
├── app/
│   ├── layout.tsx            # 全域 layout（含 Sonner <Toaster />）
│   ├── page.tsx              # 主頁（渲染 <ImageEditor />）
│   └── globals.css           # TailwindCSS v4 @theme 設定（由 shadcn init 生成）
├── components/
│   ├── editor/
│   │   ├── image-editor.tsx  # 主容器：upload → edit 分支
│   │   ├── toolbar.tsx       # Crop / Resize / Undo / Redo icon buttons
│   │   ├── image-uploader.tsx
│   │   └── export-panel.tsx  # 格式選擇 + 品質滑桿 + 下載按鈕
│   ├── crop/
│   │   ├── crop-mode.tsx     # 裁切模式根容器
│   │   ├── crop-canvas.tsx   # react-easy-crop 'use client' 包裝器
│   │   ├── aspect-ratio-selector.tsx
│   │   └── auto-crop-controls.tsx
│   └── resize/
│       ├── resize-mode.tsx
│       ├── dimension-inputs.tsx
│       ├── fitting-strategy-selector.tsx
│       └── background-color-picker.tsx
├── lib/
│   ├── auto-crop.ts          # findCropBox()（TypeScript 移植自 auto-crop-1.js）
│   ├── resize.ts             # resizeImage() + computeFitRect() with pica
│   ├── image-export.ts       # canvasToBlob(), cropToCanvas(), downloadBlob()
│   └── empty.ts              # 空模組（turbopack resolveAlias 用）
├── hooks/
│   └── use-editor-store.ts   # Zustand + zundo + immer 全域 store
├── types/
│   └── editor.ts             # 所有 TypeScript 型別
├── tests/
│   ├── unit/
│   │   ├── auto-crop.test.ts
│   │   ├── resize.test.ts
│   │   └── image-export.test.ts
│   ├── components/
│   │   ├── toolbar.test.tsx
│   │   ├── crop-canvas.test.tsx
│   │   └── fitting-strategy-selector.test.tsx
│   └── e2e/
│       ├── crop.spec.ts      # P1 完整流程
│       ├── auto-crop.spec.ts # P2 完整流程
│       └── resize.spec.ts    # P3 完整流程
├── public/
├── auto-crop-1.js            # 原始算法參考（不直接使用，TypeScript 移植至 lib/）
├── next.config.ts
├── package.json
└── README.md                 # 含 Vercel Deploy Button
```

**Structure Decision**: 標準 Next.js 16 App Router 單一專案結構。所有圖片處理邏輯集中在 `lib/`，元件分 `editor/`、`crop/`、`resize/` 三層，各層職責清晰。測試分 `unit/`、`components/`、`e2e/` 三層對應憲法 II 原則。

## Complexity Tracking

| 複雜度來源 | 必要原因 | 更簡單替代方案被拒絕的原因 |
|-----------|---------|------------------------|
| `pica` 需 dynamic import | Next.js 16 Turbopack 在 build 階段執行模組，`pica` 呼叫 `window`/`Worker` 導致 SSR 錯誤 | 無法繞過：即使加 `'use client'` 仍在 build 時 import |
| `zundo` temporal middleware | Undo/Redo 需要歷史快照堆疊，且必須區分「拖動中間幀」與「確認動作」兩種更新 | `useReducer` + 手動 history：需自行實作 throttle、keyboard handler、跨元件訂閱，反而更複雜 |

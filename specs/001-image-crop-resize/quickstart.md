# 快速上手：圖片裁切與縮放編輯器

**功能分支**: `001-image-crop-resize`
**建立日期**: 2026-03-22

---

## 環境需求

- Node.js >= 20.9.0（LTS）
- pnpm / npm / yarn（本文使用 npm）
- 現代桌面瀏覽器（Chrome 111+、Firefox 111+、Safari 16.4+）

---

## 初始化專案

```bash
# 1. 建立 Next.js 16 + TypeScript + App Router 專案
npx create-next-app@latest pixpeel --typescript --app
cd pixpeel

# 2. 初始化 shadcn/ui（自動偵測 Tailwind v4）
npx shadcn@latest init -t next
# 選擇 style: new-york, base color: neutral

# 3. 安裝 shadcn 元件
npx shadcn@latest add button slider select input popover tooltip toggle-group sonner

# 4. 安裝圖片處理與狀態管理套件
npm install react-easy-crop pica react-colorful zustand immer zundo

# 5. 安裝 TypeScript 型別
npm install -D @types/pica
```

---

## 啟動開發伺服器

```bash
npm run dev
# 開啟 http://localhost:3000
```

---

## 專案結構

```
pixpeel/
├── app/
│   ├── layout.tsx            # 全域 layout（含 Sonner Toaster）
│   ├── page.tsx              # 主頁（渲染 ImageEditor）
│   └── globals.css           # TailwindCSS v4 @theme 設定
├── components/
│   ├── editor/
│   │   ├── image-editor.tsx  # 主容器
│   │   ├── toolbar.tsx       # 工具列（Crop/Resize/Undo/Redo）
│   │   ├── image-uploader.tsx
│   │   └── export-panel.tsx
│   ├── crop/
│   │   ├── crop-mode.tsx
│   │   ├── crop-canvas.tsx   # react-easy-crop 包裝器
│   │   ├── aspect-ratio-selector.tsx
│   │   └── auto-crop-controls.tsx
│   └── resize/
│       ├── resize-mode.tsx
│       ├── dimension-inputs.tsx
│       ├── fitting-strategy-selector.tsx
│       └── background-color-picker.tsx
├── lib/
│   ├── auto-crop.ts          # findCropBox()（移植自 auto-crop-1.js）
│   ├── resize.ts             # resizeImage() with pica
│   ├── image-export.ts       # canvasToBlob(), cropToCanvas()
│   └── empty.ts              # 空模組（給 turbopack resolveAlias 使用）
├── hooks/
│   └── use-editor-store.ts   # Zustand + zundo + immer store
├── types/
│   └── editor.ts             # 全域 TypeScript 型別
├── next.config.ts
└── specs/001-image-crop-resize/  # 本文件所在目錄
```

---

## next.config.ts 設定

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // 若 pica 或其依賴嘗試在客戶端 bundle 引入 Node.js 模組，別名到空模組
      fs: './src/lib/empty.ts',
      path: './src/lib/empty.ts',
    },
  },
}

export default nextConfig
```

---

## 功能驗證：用戶故事獨立測試

### P1：手動裁切圖片

1. 開啟 `http://localhost:3000`
2. 上傳一張 JPEG/PNG/WebP 圖片（點擊或拖曳）
3. 確認：應用自動進入裁切模式，裁切框覆蓋全圖
4. 拖動裁切框右下角 → 確認框即時縮小並顯示預覽
5. 啟用長寬比鎖定（選擇 `16:9`）→ 拖動任意角 → 確認長寬比維持
6. 點擊「下載」→ 確認瀏覽器觸發下載，輸出為裁切後的圖片

**預期結果**：下載圖片尺寸 = 裁切框的 `width × height`，內容正確

---

### P2：自動裁切

1. 準備一張四周有明顯白色/純色邊框的圖片（例如白底截圖）
2. 上傳圖片
3. 點擊「自動裁切」按鈕
4. 確認：裁切框自動收縮至非白色內容的邊界
5. 調整容差滑桿（例如從 5 調整到 20）→ 確認裁切框即時更新
6. 手動微調裁切框 → 點擊下載

**邊界測試**：上傳一張純色圖片（全白或全黑） → 確認顯示警告 toast「無法偵測到非背景內容」

---

### P3：調整圖片尺寸（三種策略）

1. 上傳任意圖片（例如 800×600 的橫向圖）
2. 點擊工具列的 Resize icon → 切換至縮放模式
3. 輸入目標尺寸：`400 × 400`

**Contain 測試**：
- 選擇 `Contain`，背景色選白色 → 下載
- 確認輸出尺寸為 400×400，原圖完整顯示（上下或左右有白色留白）

**Cover 測試**：
- 選擇 `Cover` → 下載
- 確認輸出尺寸為 400×400，圖片填滿（部分內容被裁切）

**Fill 測試**：
- 選擇 `Fill / Stretch` → 下載
- 確認輸出尺寸為 400×400，圖片被拉伸填滿（可能變形）

---

### Undo/Redo 驗證

1. 上傳圖片
2. 拖動裁切框（縮小到左上角）
3. 按 `Ctrl+Z` → 確認裁切框恢復到上一步
4. 按 `Ctrl+Y` → 確認裁切框恢復至 redo 狀態
5. Undo 到底後，確認 Undo button 顯示 disabled
6. 切換到 Resize 模式 → 按 `Ctrl+Z` → 確認回到 Crop 模式

---

## 輸出格式驗證

1. 上傳 PNG 圖片 → 確認格式下拉預設選 PNG
2. 選擇 JPEG 格式 → 確認品質滑桿顯示（預設 92%）
3. 下載並確認輸出為 JPEG 格式

---

## Vercel 部署

```bash
# 安裝 Vercel CLI（可選）
npm i -g vercel

# 部署
vercel
```

或直接使用 README 中的 Vercel Deploy Button（見 README.md）。

**Vercel Project Settings**：
- Node.js Version：**20.x**（必須 >= 20.9）
- Build Command：`next build`（自動偵測）
- Output Directory：`.next`（自動偵測）
- 無需設定環境變數（純客戶端應用）

---

## 測試

```bash
# 單元測試（Vitest）
npm run test

# 元件測試（React Testing Library）
npm run test:components

# E2E 測試（Playwright）
npm run test:e2e
```

**測試策略**：
- `lib/auto-crop.ts`：單元測試，使用模擬 `ImageData` 驗證邊界掃描算法
- `lib/resize.ts`：單元測試 `computeFitRect()`，整合測試 `resizeImage()`
- `components/crop/crop-canvas.tsx`：React Testing Library 測試 cropComplete 回調
- `components/resize/fitting-strategy-selector.tsx`：互動測試三種策略切換
- E2E：Playwright 跑完整用戶流程（P1、P2、P3 各一個完整場景）

# 研究報告：圖片裁切與縮放編輯器

**功能分支**: `001-image-crop-resize`
**研究日期**: 2026-03-22

---

## 1. 裁切 UI 套件：react-easy-crop

**決策**：採用 `react-easy-crop` v5.5.6

**理由**：
- 每週下載量 ~905,000，最後發布 2025 年 11 月，積極維護
- 原生支援 React 19（peerDependencies `>=16.4.0`）
- 提供 `onCropComplete` 回調，直接輸出 `croppedAreaPixels: { x, y, width, height }`（像素座標，可直接傳給 Canvas）
- 內建長寬比鎖定、縮放滑桿、拖動手把，與規格完全吻合
- Next.js App Router 整合：在 wrapper component 加 `'use client'` 即可，無需 `dynamic()`

**alternatives considered**：
- `react-image-crop` v11：較小（<5KB）但無縮放 UI，stars ~4,100，最後更新約 1 年前
- `react-cropper`（CropperJS 1.x wrapper）：已棄用（2022 年停止維護）
- `react-advanced-cropper`：stars ~861，基本停滯，週下載量極低

**使用模式**：
```tsx
// components/crop/crop-canvas.tsx
'use client'
import Cropper from 'react-easy-crop'

const onCropComplete = (_area, croppedAreaPixels) => {
  // croppedAreaPixels = { x, y, width, height } 全為源圖片像素座標
  setCroppedAreaPixels(croppedAreaPixels)
}
```

---

## 2. 縮放套件：pica

**決策**：採用 `pica` v9.0.1

**理由**：
- 瀏覽器端最高品質的縮放算法（Lanczos3 + mks2013 銳利化濾鏡）
- 使用 WebWorker 與 WebAssembly（自動回退）提升效能
- 純客戶端，無 Node.js 二進制依賴，Vercel 部署完全相容
- 解決 Nearest-Neighbor 的鋸齒問題，同時比 Bicubic 快
- Stars ~4,000，週下載量 ~242,000，Stability AI 等生產環境使用
- 2021 年後無新版本 = 功能完整穩定，非棄用

**Next.js SSR 問題與解決方案**：
pica 在模組載入時呼叫 `window`、`Worker`、`WebAssembly`，即使在 `'use client'` 檔案中也會在 build 階段拋出錯誤。必須使用動態 import：

```ts
// lib/resize.ts — 只在 useEffect 或 callback 中 import
export async function getResizer() {
  const { default: Pica } = await import('pica')
  return new Pica()
}
```

**Contain / Cover / Fill 實作方式**：
pica 本身只做「把 src canvas resize 到 dst canvas 大小」。三種策略的幾何計算在 pica 呼叫前完成：

```
Contain: 計算保持長寬比的縮放比例（取 min(dstW/srcW, dstH/srcH)），居中合成到 dstW×dstH 背景 canvas
Cover:   取 max(dstW/srcW, dstH/srcH)，居中裁切超出部分
Fill:    直接 pica.resize(src, dst) 其中 dst.width=dstW, dst.height=dstH
```

**alternatives considered**：
- `browser-image-resizer`：stars ~75，週下載量 ~7,400，階梯式降採樣品質差
- 原生 `canvas.drawImage()`：nearest-neighbor 品質不足
- `sharp`：僅 Node.js，瀏覽器不可用

---

## 3. 狀態管理 + Undo/Redo：Zustand + zundo + immer

**決策**：`zustand` + `zundo`（temporal middleware）+ `immer`

**理由**：
- 總 bundle 約 8KB gzip（zustand ~2KB + zundo <1KB + immer ~5KB）
- `zundo` 的 `partialize` 只快照刻意的使用者操作，不記錄拖動中間幀（關鍵：避免 undo 進入奇怪的中間狀態）
- `temporal.getState().undo()` / `.redo()` 同步，方便綁定 `Ctrl+Z` / `Ctrl+Y`
- Zustand v4+ 使用 `useSyncExternalStore`，React 19 完全相容
- `partialize` 設定：只追蹤 `cropBox`、`zoom`、`rotation`、`resizeConfig`、`mode`、`bgColor`

**alternatives considered**：
- `useReducer` + 手動 history：零依賴，但需自行實作 throttle、cross-component subscription 困難
- Redux Toolkit：bundle 過重（~15KB），過度工程

**歷史快照時機**（重要）：
- `onCropChange`（拖動中）→ **不**記錄歷史（更新 UI state 只）
- `onCropComplete`（放開手把後）→ 記錄歷史快照
- 縮放設定變更 → 記錄歷史快照
- 模式切換 → 記錄歷史快照

---

## 4. Canvas 匯出：原生瀏覽器 API

**決策**：使用原生 `HTMLCanvasElement.toBlob()`，無需額外套件

**理由**：
- 所有現代瀏覽器原生支援 PNG、JPEG、WebP
- `toBlob` 為非同步、記憶體效率優於 `toDataURL`（後者產生 base64 字串，記憶體佔用兩倍）
- pica 也提供 `pica.toBlob()` 作為便捷包裝，行為相同

```ts
async function exportCanvas(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      format,
      quality   // PNG 忽略此參數（無損）
    )
  })
}
```

---

## 5. 顏色選擇器：react-colorful + shadcn Popover

**決策**：`react-colorful` + shadcn `Popover` 組合

**理由**：
- shadcn/ui 官方無顏色選擇器元件（issue 自 2023 年起開放，未解決）
- `react-colorful` < 2.8KB gzipped，無外部依賴，廣泛社群使用
- 包裝在 shadcn `Popover` 內，視覺一致性最佳

**alternatives considered**：
- 原生 `<input type="color">`：零依賴，但無法自訂樣式，各瀏覽器外觀不一致

---

## 6. Next.js 16 重要變更（與本專案相關）

| 項目 | 變更 | 本專案影響 |
|------|------|-----------|
| Turbopack | dev + build 皆預設啟用 | 無需 `--turbo` flag；若有自訂 webpack config 需遷移 |
| Node.js 最低版本 | 20.9.0（LTS）| Vercel Project Settings 需設定 Node 20 |
| `proxy.ts` | 取代 `middleware.ts` | 本專案無 middleware，無影響 |
| React | 19.2 | zustand v4+、react-easy-crop 均相容 |
| `tailwind.config.js` | 移至 `globals.css` 的 `@theme` | shadcn init 自動處理 |
| `serverRuntimeConfig` | 已移除 | 本專案無 server config，無影響 |

**Turbopack 與 pica 的 Node.js built-ins**：
若 pica 或其依賴嘗試在客戶端 bundle 中 import Node.js 模組，使用：
```ts
// next.config.ts
turbopack: {
  resolveAlias: { fs: './src/lib/empty.ts', path: './src/lib/empty.ts' }
}
```

---

## 7. TailwindCSS v4 + shadcn/ui 相容性

**結論**：完全相容，shadcn 官方支援 Tailwind v4，`shadcn@latest` CLI 自動生成 v4 相容元件。

**初始化指令**：
```bash
npx create-next-app@latest pixpeel --typescript --app
npx shadcn@latest init -t next
```

**需安裝的 shadcn 元件**：
```bash
npx shadcn@latest add button slider select input popover tooltip toggle-group
```

**額外套件**：
```bash
npm install react-colorful
```

---

## 8. Vercel Deploy Button

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2Fpixpeel&project-name=pixpeel&repository-name=pixpeel)
```

純客戶端應用，無需預設環境變數。Vercel 自動偵測 Next.js 並設定正確的 build 指令。

---

## 決策彙整

| 需求 | 選定套件/方案 | 版本 |
|------|-------------|------|
| 裁切 UI | react-easy-crop | 5.5.6 |
| 圖片縮放 | pica | 9.0.1 |
| 狀態管理 | zustand | 4.x / 5.x |
| Undo/Redo | zundo (temporal middleware) | 3.x |
| Immutable updates | immer | latest |
| 顏色選擇器 | react-colorful | latest |
| Canvas 匯出 | 原生 toBlob API | N/A |
| UI 元件 | shadcn/ui (new-york style) | latest |
| CSS | TailwindCSS v4 | 4.x |
| 框架 | Next.js 16 + React 19 | 16.x / 19.2 |
| 部署 | Vercel | N/A |

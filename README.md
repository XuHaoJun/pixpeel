# Pixpeel

輕量的前端圖片處理工具，支援手動裁切、自動裁切與三種縮放策略（Contain / Cover / Fill）。完全在瀏覽器端執行，無需上傳伺服器。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2Fpixpeel&project-name=pixpeel&repository-name=pixpeel)

## 功能

- **手動裁切** — 拖動裁切框與控點，支援多種長寬比鎖定（1:1、4:3、16:9 等）
- **自動裁切** — 一鍵偵測圖片主體邊界，可調整容差滑桿
- **縮放模式** — 輸入目標尺寸，選擇三種適配策略：
  - **Contain** — 保持比例縮放，多餘區域填背景色（支援透明）
  - **Cover** — 保持比例填滿，超出部分居中裁切
  - **Fill** — 強制拉伸至目標尺寸，不保持比例
- **Undo / Redo** — 完整歷史記錄，支援鍵盤快捷鍵（Ctrl+Z / Ctrl+Y）
- **多格式匯出** — PNG、JPEG、WebP，JPEG/WebP 可調整品質

## 使用技術

- [Next.js 16](https://nextjs.org/) — App Router + Turbopack
- [React 19](https://react.dev/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — new-york style
- [react-easy-crop](https://github.com/ValentinH/react-easy-crop) — 裁切 UI
- [pica](https://github.com/nodeca/pica) — 瀏覽器端 Lanczos3 縮放
- [Zustand](https://github.com/pmndrs/zustand) + [zundo](https://github.com/charkour/zundo) — 狀態管理與 Undo/Redo
- [react-colorful](https://github.com/omgovich/react-colorful) — 色彩選擇器

## 本地開發

**需求**：Node.js 20.9+

```bash
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

## 測試

```bash
# 單元測試
npm run test

# 元件測試
npm run test:components

# E2E 測試（需先啟動 dev server）
npm run dev
npm run test:e2e
```

## 部署

點擊上方 Deploy with Vercel 按鈕，或手動執行：

```bash
npm run build
```

確認 build 無誤後推送至 GitHub，Vercel 將自動偵測 Next.js 並部署。

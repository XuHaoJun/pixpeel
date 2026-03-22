# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start Next.js dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests (tests/unit/)
npm run test:components  # Component tests (tests/components/)
npm run test:e2e     # Playwright E2E tests
npm run test:watch   # Vitest in watch mode

# Run a single test file
npx vitest run tests/unit/auto-crop.test.ts
```

## Architecture

This is a client-side image editing tool (crop + resize + export). All processing happens in the browser — no server-side image logic.

### State management

The entire editor state lives in a single Zustand store (`hooks/use-editor-store.ts`) with two layers:

- **`useEditorStore`** — main store using `immer` middleware for mutations
- **`useEditorStore.temporal`** — undo/redo history via `zundo` temporal middleware; only a subset of state is tracked (`mode`, `cropBox`, `zoom`, `aspectRatio`, `autoCropConfig`, `resizeConfig`)

Key distinction in crop actions:
- `setCropBox` — records a history snapshot (call after user finishes interacting)
- `updateCropBoxPreview` — updates state without history via `pause()`/`resume()` (call during drag mid-frames and during react-easy-crop initialization)

### Crop library

`CropCanvas` uses **`react-image-crop`** (not `react-easy-crop`). The user sees the full image and drags handles to resize/reposition the crop selection. `onChange` (mid-drag) calls `onCropChange` → `updateCropBoxPreview` (no history); `onComplete` (mouse-up) calls `onCropComplete` → `setCropBox` (records history). A `lastCropBoxRef` prevents the external-cropBox sync `useEffect` (used for undo/redo and auto-crop) from fighting with in-progress user drags.

### UI components

`components/ui/` wraps **`@base-ui/react`** (not Radix UI). Key API differences from standard shadcn:
- No `asChild` prop — use the `render` prop instead: `<TooltipTrigger render={<Button .../>}>`
- `ToggleGroup.onValueChange` always receives `Value[]` — extract `v[0]`
- `Slider.value` is `number`, not an array

### Image processing pipeline

1. `lib/image-export.ts` — `cropToCanvas`: draws the cropped region onto a `<canvas>`
2. `lib/resize.ts` — `resizeImage`: uses **pica** (with `features: ['js']` — web workers disabled due to Turbopack bundling incompatibility) for high-quality downscaling; `computeFitRect` handles contain/cover/fill geometry
3. `lib/auto-crop.ts` — `findCropBox`: scans pixel alpha/luma values to auto-detect content bounds
4. Export: `canvasToBlob` + `downloadBlob` trigger browser download

### Turbopack notes

- `fs` module is aliased to `lib/empty.ts` (a no-op stub) so browser-only libs don't break
- Do **not** add a `path` alias — it breaks Next.js internal SSR (`path.parse`)
- pica must use `features: ['js']` — its worker chunks reference `__turbopack_context__` at load time

### Testing

- Unit tests: Vitest + jsdom + `@testing-library/react`; setup in `tests/setup.ts` (imports `@testing-library/jest-dom`)
- `HTMLCanvasElement.getContext` is not implemented in jsdom — mock it in `beforeEach` for tests that call canvas APIs
- CI runs `npm test` (unit only) via `.github/workflows/ci.yml`

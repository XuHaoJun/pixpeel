import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "@/components/editor/toolbar";

function renderToolbar(props: Partial<Parameters<typeof Toolbar>[0]> = {}) {
  const defaults = {
    mode: "crop" as const,
    canUndo: false,
    canRedo: false,
    onCropMode: vi.fn(),
    onResizeMode: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    ...props,
  };
  render(
    <TooltipProvider>
      <Toolbar {...defaults} />
    </TooltipProvider>
  );
  return defaults;
}

// Shadcn Tooltip with Base UI renders a wrapper element around the trigger.
// Use data-slot="button" to target the actual shadcn Button elements.
function getActionButton(label: string): HTMLElement {
  const all = screen.getAllByRole("button", { name: label });
  // The inner shadcn button has data-slot="button"
  return all.find((b) => b.getAttribute("data-slot") === "button") ?? all[all.length - 1];
}

describe("Toolbar", () => {
  it("Undo button 在 canUndo=false 時顯示 disabled", () => {
    renderToolbar({ canUndo: false });
    expect(getActionButton("復原")).toBeDisabled();
  });

  it("Undo button 在 canUndo=true 時可點擊", () => {
    renderToolbar({ canUndo: true });
    expect(getActionButton("復原")).not.toBeDisabled();
  });

  it("Redo button 在 canRedo=false 時顯示 disabled", () => {
    renderToolbar({ canRedo: false });
    expect(getActionButton("重做")).toBeDisabled();
  });

  it("Redo button 在 canRedo=true 時可點擊", () => {
    renderToolbar({ canRedo: true });
    expect(getActionButton("重做")).not.toBeDisabled();
  });

  it("點擊 Resize icon 觸發 onResizeMode", async () => {
    const user = userEvent.setup();
    const { onResizeMode } = renderToolbar();
    await user.click(getActionButton("縮放模式"));
    expect(onResizeMode).toHaveBeenCalledOnce();
  });

  it("點擊 Undo 觸發 onUndo", async () => {
    const user = userEvent.setup();
    const { onUndo } = renderToolbar({ canUndo: true });
    await user.click(getActionButton("復原"));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});

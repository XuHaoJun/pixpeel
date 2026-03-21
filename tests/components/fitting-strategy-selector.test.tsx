import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FittingStrategySelector } from "@/components/resize/fitting-strategy-selector";

describe("FittingStrategySelector", () => {
  it("三個策略選項均可見", () => {
    render(<FittingStrategySelector value="contain" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Contain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cover" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fill" })).toBeInTheDocument();
  });

  it("當前選中的策略 aria-pressed=true", () => {
    render(<FittingStrategySelector value="cover" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cover" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Contain" })).toHaveAttribute("aria-pressed", "false");
  });

  it("點擊 Cover 後 onChange 被呼叫並傳入 cover", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FittingStrategySelector value="contain" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Cover" }));
    expect(onChange).toHaveBeenCalledWith("cover");
  });

  it("點擊 Fill 後 onChange 被呼叫並傳入 fill", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FittingStrategySelector value="contain" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Fill" }));
    expect(onChange).toHaveBeenCalledWith("fill");
  });

  it("策略選項使用 button role（不使用 radio）", () => {
    render(<FittingStrategySelector value="contain" onChange={vi.fn()} />);
    // ToggleGroup 渲染 button，而非 radio
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});

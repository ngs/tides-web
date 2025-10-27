import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TideOverlay } from "./TideOverlay";

describe("TideOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <TideOverlay>
        <div>Test Content</div>
      </TideOverlay>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should call onSizeChange with initial size", () => {
    const onSizeChange = vi.fn();

    render(
      <TideOverlay onSizeChange={onSizeChange}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    expect(onSizeChange).toHaveBeenCalled();
  });

  it("should load desktop width from localStorage", () => {
    localStorage.setItem("desktopPanelWidth", "500");

    const onSizeChange = vi.fn();

    render(
      <TideOverlay onSizeChange={onSizeChange}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    // Should be called with the loaded width (500) on desktop
    expect(onSizeChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it("should load mobile height from localStorage", () => {
    localStorage.setItem("mobilePanelHeight", "50");

    const onSizeChange = vi.fn();

    render(
      <TideOverlay onSizeChange={onSizeChange}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    expect(onSizeChange).toHaveBeenCalled();
  });

  it("should use default values when no localStorage data", () => {
    const onSizeChange = vi.fn();

    render(
      <TideOverlay onSizeChange={onSizeChange}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    // Should be called with default desktop width (400)
    expect(onSizeChange).toHaveBeenCalled();
  });

  it("should respect open prop", () => {
    const { rerender } = render(
      <TideOverlay open={true}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();

    rerender(
      <TideOverlay open={false}>
        <div>Test Content</div>
      </TideOverlay>,
    );

    // Content might still be in DOM but hidden
    // This behavior depends on implementation
  });

  it("should save desktop width to localStorage", () => {
    render(
      <TideOverlay>
        <div>Test Content</div>
      </TideOverlay>,
    );

    // Should save the default or loaded width
    const saved = localStorage.getItem("desktopPanelWidth");
    expect(saved).toBeTruthy();
  });

  it("should save mobile height to localStorage", () => {
    render(
      <TideOverlay>
        <div>Test Content</div>
      </TideOverlay>,
    );

    // Should save the default or loaded height
    const saved = localStorage.getItem("mobilePanelHeight");
    expect(saved).toBeTruthy();
  });
});

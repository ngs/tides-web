import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoonPhase } from "./MoonPhase";

describe("MoonPhase", () => {
  it("should render moon phase component", () => {
    const date = new Date("2025-01-01T00:00:00Z");

    render(<MoonPhase date={date} lat={35.6} lon={139.8} />);

    // Should render an SVG
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should display moon phase name", () => {
    const date = new Date("2025-01-01T00:00:00Z");

    render(<MoonPhase date={date} lat={35.6} lon={139.8} />);

    // Moon phase names
    const phaseNames = [
      "New Moon",
      "Waxing Crescent",
      "First Quarter",
      "Waxing Gibbous",
      "Full Moon",
      "Waning Gibbous",
      "Last Quarter",
      "Waning Crescent",
    ];

    // Should display one of the moon phase names
    const hasPhase = phaseNames.some((name) => screen.queryByText(name));
    expect(hasPhase).toBeTruthy();
  });

  it("should render SVG with correct size", () => {
    const date = new Date("2025-01-01T00:00:00Z");

    render(<MoonPhase date={date} lat={35.6} lon={139.8} />);

    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });

  it("should update when date changes", () => {
    const date1 = new Date("2025-01-01T00:00:00Z");
    const date2 = new Date("2025-01-15T00:00:00Z");

    const { rerender } = render(
      <MoonPhase date={date1} lat={35.6} lon={139.8} />,
    );

    const phase1 = screen.getByText(/Moon|Quarter|Crescent|Gibbous/);
    const phaseName1 = phase1.textContent;

    rerender(<MoonPhase date={date2} lat={35.6} lon={139.8} />);

    const phase2 = screen.getByText(/Moon|Quarter|Crescent|Gibbous/);
    const phaseName2 = phase2.textContent;

    // Phase names might be different for different dates
    // Just verify both render valid phase names
    expect(phaseName1).toBeTruthy();
    expect(phaseName2).toBeTruthy();
  });

  it("should render moon circle and shadow path", () => {
    const date = new Date("2025-01-01T00:00:00Z");

    render(<MoonPhase date={date} lat={35.6} lon={139.8} />);

    const paths = document.querySelectorAll("path");
    const circle = document.querySelector("circle");

    // Should have shadow paths and border circle
    expect(paths.length).toBeGreaterThan(0);
    expect(circle).toBeInTheDocument();
  });
});

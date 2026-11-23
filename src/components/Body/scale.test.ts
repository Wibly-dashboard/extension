import { describe, expect, it } from "vitest";
import { REFERENCE_SIZE, toPixel, toRatio } from "./position";
import { getWidgetScale, MAX_WIDGET_SCALE, MIN_WIDGET_SCALE } from "./scale";

describe("getWidgetScale", () => {
  it("is 1 at the reference size", () => {
    expect(getWidgetScale(REFERENCE_SIZE)).toBe(1);
  });

  it("scales by the same ratio when width and height shrink together", () => {
    expect(getWidgetScale({ width: 1920, height: 953.25 })).toBe(0.75);
    expect(getWidgetScale({ width: 1280, height: 635.5 })).toBe(0.5);
  });

  it("uses the smaller of the width and height ratios", () => {
    // width 0.75, height ~0.63 -> height
    expect(getWidgetScale({ width: 1920, height: 800 })).toBeCloseTo(800 / 1271, 3);
    // width 0.5, height ~0.79 -> width
    expect(getWidgetScale({ width: 1280, height: 1000 })).toBe(0.5);
  });

  it("never goes below the minimum scale on small screens (1023px, 767px breakpoints)", () => {
    expect(getWidgetScale({ width: 1023, height: 768 })).toBe(MIN_WIDGET_SCALE);
    expect(getWidgetScale({ width: 767, height: 1024 })).toBe(MIN_WIDGET_SCALE);
    expect(getWidgetScale({ width: 375, height: 812 })).toBe(MIN_WIDGET_SCALE);
  });

  it("never shrinks widgets when the screen gets larger", () => {
    const widths = [375, 767, 768, 1023, 1024, 1280, 1440, 1920, 2560, 3840];
    const scales = widths.map((width) => getWidgetScale({ width, height: width / 2 }));

    scales.slice(1).forEach((scale, index) => expect(scale).toBeGreaterThanOrEqual(scales[index]));
  });

  it("never goes above the maximum scale on very large screens", () => {
    expect(getWidgetScale({ width: 7680, height: 4320 })).toBe(MAX_WIDGET_SCALE);
  });

  it("compares in physical pixels using the device pixel ratio (OS scaling)", () => {
    // 2560x1440 monitor at 150% Windows scaling -> 1707x791 CSS px, 2560x1186 physical px
    expect(getWidgetScale({ width: 1707, height: 791 }, 1.5)).toBeCloseTo((791 * 1.5) / 1271, 3);
    // a 1920px laptop at 125% scaling is the same physical size as a 1920px screen at 100%
    expect(getWidgetScale({ width: 1536, height: 762.6 }, 1.25)).toBe(getWidgetScale({ width: 1920, height: 953.25 }));
  });

  it("ignores an invalid device pixel ratio", () => {
    expect(getWidgetScale(REFERENCE_SIZE, 0)).toBe(1);
    expect(getWidgetScale(REFERENCE_SIZE, Number.NaN)).toBe(1);
  });

  it("falls back to 1 when the viewport cannot be measured", () => {
    expect(getWidgetScale({ width: 0, height: 0 })).toBe(1);
  });

  it("keeps a widget aligned to the right edge when size and position scale together", () => {
    // a 464px-wide widget placed flush against the right edge of the reference screen
    const widgetWidth = 464;
    const ratio = toRatio({ x: REFERENCE_SIZE.width - widgetWidth, y: 0 }, REFERENCE_SIZE);

    const screen = { width: 1920, height: 953.25 };
    const position = toPixel(ratio, screen);

    expect(position.x + widgetWidth * getWidgetScale(screen)).toBeCloseTo(screen.width, 6);
  });
});

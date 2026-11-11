import { describe, expect, it } from "vitest";
import { clampPosition, REFERENCE_SIZE, toPixel, toRatio } from "./position";

describe("toRatio / toPixel", () => {
  it("round-trips a position at the reference size", () => {
    const pixel = { x: 2145, y: 260 };
    const ratio = toRatio(pixel, REFERENCE_SIZE);

    expect(toPixel(ratio, REFERENCE_SIZE)).toEqual(pixel);
  });

  it("keeps the same proportional layout on a smaller screen", () => {
    const ratio = toRatio({ x: 1280, y: 635.5 }, REFERENCE_SIZE);

    const result = toPixel(ratio, { width: 1707, height: 791 });

    expect(result.x).toBeCloseTo(1280 * (1707 / 2560), 6);
    expect(result.y).toBeCloseTo(635.5 * (791 / 1271), 6);
  });
});

describe("clampPosition", () => {
  it("preserves fractional centered coordinates while keeping positions in bounds", () => {
    expect(
      clampPosition({ x: 915.5, y: 935 }, { x: 2000, y: 1500 }),
    ).toEqual({ x: 915.5, y: 935 });
  });

  it("clamps positions outside the container", () => {
    expect(clampPosition({ x: -10, y: 1600 }, { x: 2000, y: 1500 })).toEqual({
      x: 0,
      y: 1500,
    });
  });
});

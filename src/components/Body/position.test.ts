import { describe, expect, it } from "vitest";
import { clampPosition } from "./position";

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

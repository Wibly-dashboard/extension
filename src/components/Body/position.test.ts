import { describe, expect, it } from "vitest";
import {
  clampPosition,
  findNearestFreePosition,
  isColliding,
  REFERENCE_SIZE,
  toPixel,
  toRatio,
  type Position,
} from "./position";

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

describe("isColliding", () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };

  it("treats widgets exactly gap apart as not colliding", () => {
    expect(isColliding(a, { x: 110, y: 0, width: 100, height: 100 }, 10)).toBe(false);
  });

  it("treats widgets closer than gap as colliding", () => {
    expect(isColliding(a, { x: 109, y: 0, width: 100, height: 100 }, 10)).toBe(true);
  });
});

describe("findNearestFreePosition", () => {
  const max = { x: 950, y: 950 }; // 1000x1000 컨테이너에 50x50 위젯
  const size = { width: 50, height: 50 };
  const blocker = { x: 100, y: 100, width: 100, height: 100 };
  const clamp = (position: Position) => clampPosition(position, max);

  it("keeps the desired position when it is free", () => {
    const desired = { x: 400, y: 400 };

    expect(
      findNearestFreePosition({ desired, size, max, others: [blocker], gap: 10, normalize: clamp }),
    ).toEqual(desired);
  });

  it("moves to the nearest side of the blocking widget, keeping the gap", () => {
    // 오른쪽 끝(210)까지 30px, 위쪽(40)까지 70px → 오른쪽 바로 옆으로
    expect(
      findNearestFreePosition({ desired: { x: 180, y: 110 }, size, max, others: [blocker], gap: 10, normalize: clamp }),
    ).toEqual({ x: 210, y: 110 });
  });

  it("finds a spot right next to the blocker even when it is not on the scan grid", () => {
    // 그리드 간격(100)으로만 훑으면 x=300으로 밀려나지만, 바로 옆 x=210이 더 가깝다
    expect(
      findNearestFreePosition({
        desired: { x: 190, y: 100 },
        size,
        max,
        others: [blocker],
        gap: 10,
        normalize: clamp,
      }),
    ).toEqual({ x: 210, y: 100 });
  });

  it("measures distance with the grid-snapped candidate and stays on the grid", () => {
    const snapTo20 = (position: Position) =>
      clamp({ x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 });

    // 오른쪽 옆(210)은 그리드에 맞추면 220이 된다
    expect(
      findNearestFreePosition({
        desired: { x: 180, y: 120 },
        size,
        max,
        others: [blocker],
        gap: 10,
        normalize: snapTo20,
        gridStep: 20,
      }),
    ).toEqual({ x: 220, y: 120 });
  });

  it("returns undefined when there is no free space", () => {
    const fullScreen = { x: 0, y: 0, width: 1000, height: 1000 };

    expect(
      findNearestFreePosition({ desired: { x: 10, y: 10 }, size, max, others: [fullScreen], gap: 0, normalize: clamp }),
    ).toBeUndefined();
  });
});

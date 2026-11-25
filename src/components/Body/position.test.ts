import { describe, expect, it } from "vitest";
import {
  clampPosition,
  findNearestFreePosition,
  findRandomFreePosition,
  fromAnchorRatio,
  isColliding,
  REFERENCE_SIZE,
  resolveOverlaps,
  toAnchorRatio,
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

  it("keeps the exact gap next to a widget even with grid snapping", () => {
    const snapTo20 = (position: Position) =>
      clamp({ x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 });

    // 오른쪽 옆(210)은 그리드(220)로 옮기지 않고 정확히 gap만큼 떨어뜨린다. 다른 축(y)은 그리드에 맞춘다
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
    ).toEqual({ x: 210, y: 120 });
  });

  it("stacks widgets with equal gaps regardless of grid offset", () => {
    // 위젯 A는 화면 위 끝(y=0, 그리드 밖)에, B는 그 아래에 있다. C를 B 아래에 놓으면 A-B 간격과 같아야 한다
    const widgetSize = { width: 100, height: 148 };
    const a = { x: 800, y: 0, ...widgetSize };
    const b = { x: 800, y: 158, ...widgetSize };
    const snapTo25 = (position: Position) =>
      clampPosition({ x: Math.round(position.x / 25) * 25, y: Math.round(position.y / 25) * 25 }, { x: 900, y: 852 });

    expect(
      findNearestFreePosition({
        desired: { x: 800, y: 300 },
        size: widgetSize,
        max: { x: 900, y: 852 },
        others: [a, b],
        gap: 10,
        normalize: snapTo25,
        gridStep: 25,
        snapThreshold: 25,
      }),
    ).toEqual({ x: 800, y: 316 });
  });

  it("snaps a free drop position to the nearby neighbor gap", () => {
    // 블로커 아래 옆자리(210)에서 15px 떨어진 빈자리에 놓으면 옆자리로 붙인다
    expect(
      findNearestFreePosition({
        desired: { x: 100, y: 225 },
        size,
        max,
        others: [blocker],
        gap: 10,
        normalize: clamp,
        snapThreshold: 20,
      }),
    ).toEqual({ x: 100, y: 210 });
  });

  it("does not snap to a widget that is not lined up on the other axis", () => {
    // x가 블로커 범위 밖이면 블로커 아래 옆자리(210)에 붙이지 않는다
    const desired = { x: 400, y: 225 };

    expect(
      findNearestFreePosition({ desired, size, max, others: [blocker], gap: 10, normalize: clamp, snapThreshold: 20 }),
    ).toEqual(desired);
  });

  it("returns undefined when there is no free space", () => {
    const fullScreen = { x: 0, y: 0, width: 1000, height: 1000 };

    expect(
      findNearestFreePosition({ desired: { x: 10, y: 10 }, size, max, others: [fullScreen], gap: 0, normalize: clamp }),
    ).toBeUndefined();
  });
});

describe("toAnchorRatio / fromAnchorRatio", () => {
  const container = { width: 1000, height: 500 };
  const widget = { width: 200, height: 100 };

  it("maps the left/top edge, center and right/bottom edge to 0, 0.5 and 1", () => {
    expect(toAnchorRatio({ x: 0, y: 0 }, container, widget)).toEqual({ x: 0, y: 0 });
    expect(toAnchorRatio({ x: 400, y: 200 }, container, widget)).toEqual({ x: 0.5, y: 0.5 });
    expect(toAnchorRatio({ x: 800, y: 400 }, container, widget)).toEqual({ x: 1, y: 1 });
  });

  it("round-trips a position", () => {
    const pixel = { x: 123, y: 45 };

    const result = fromAnchorRatio(toAnchorRatio(pixel, container, widget), container, widget);

    expect(result.x).toBeCloseTo(pixel.x, 6);
    expect(result.y).toBeCloseTo(pixel.y, 6);
  });

  it("keeps a centered or edge-aligned widget aligned when the widget is scaled differently from the screen", () => {
    // centered / right-aligned on the reference screen at scale 1
    const centered = toAnchorRatio({ x: (2528 - 347) / 2, y: 0 }, { width: 2528, height: 1131 }, { width: 347, height: 100 });
    const rightAligned = toAnchorRatio({ x: 2528 - 464, y: 0 }, { width: 2528, height: 1131 }, { width: 464, height: 80 });

    // 150% OS scaling: the screen shrinks to 66% but the widgets only to 93%
    const screen = { width: 1675, height: 651 };
    const clock = { width: 347 * 0.934, height: 100 };
    const spotify = { width: 464 * 0.934, height: 80 };

    expect(fromAnchorRatio(centered, screen, clock).x + clock.width / 2).toBeCloseTo(screen.width / 2, 6);
    expect(fromAnchorRatio(rightAligned, screen, spotify).x + spotify.width).toBeCloseTo(screen.width, 6);
  });

  it("always stays inside the container", () => {
    expect(fromAnchorRatio({ x: 1.5, y: -0.5 }, container, widget)).toEqual({ x: 800, y: 0 });
  });

  it("puts a widget larger than the container at the origin", () => {
    expect(toAnchorRatio({ x: 10, y: 10 }, { width: 100, height: 100 }, { width: 200, height: 200 })).toEqual({ x: 0, y: 0 });
  });
});

describe("resolveOverlaps", () => {
  const container = { width: 1000, height: 500 };
  const size = { width: 100, height: 100 };

  it("keeps widgets that do not overlap where they are", () => {
    const result = resolveOverlaps(
      [
        { id: "a", position: { x: 0, y: 0 }, size },
        { id: "b", position: { x: 300, y: 0 }, size },
      ],
      container,
      10,
    );

    expect(result.get("a")).toEqual({ x: 0, y: 0 });
    expect(result.get("b")).toEqual({ x: 300, y: 0 });
  });

  it("moves a later widget that overlaps an earlier one to the nearest free spot, exactly gap away", () => {
    const result = resolveOverlaps(
      [
        { id: "a", position: { x: 100, y: 100 }, size },
        { id: "b", position: { x: 150, y: 100 }, size },
      ],
      container,
      10,
    );

    expect(result.get("a")).toEqual({ x: 100, y: 100 });
    expect(result.get("b")).toEqual({ x: 210, y: 100 });
  });

  it("never leaves any pair overlapping when there is room", () => {
    const widgets = Array.from({ length: 6 }, (_, index) => ({
      id: String(index),
      position: { x: 400 + index * 5, y: 200 },
      size,
    }));

    const result = resolveOverlaps(widgets, container, 10);
    const rects = widgets.map((widget) => ({ ...result.get(widget.id)!, ...size }));

    rects.forEach((a, i) =>
      rects.slice(i + 1).forEach((b) => expect(isColliding(a, b, 10)).toBe(false)),
    );
  });
});

describe("findRandomFreePosition", () => {
  const size = { width: 100, height: 100 };
  const container = { width: 500, height: 300 };
  const max = { x: container.width - size.width, y: container.height - size.height };
  const clamp = (position: Position) => clampPosition(position, max);

  it("never picks a spot that collides with or is closer than gap to another widget", () => {
    const others = [
      { x: 0, y: 0, width: 200, height: 150 },
      { x: 300, y: 0, width: 100, height: 100 },
    ];

    for (let i = 0; i < 50; i += 1) {
      const result = findRandomFreePosition({ size, max, others, gap: 10, normalize: clamp, step: 10 });

      expect(result).toBeDefined();
      others.forEach((other) => expect(isColliding({ ...result!, ...size }, other, 10)).toBe(false));
    }
  });

  it("only picks grid-normalized positions when there is room on the grid", () => {
    const snapToGrid = (position: Position) => clamp({ x: Math.round(position.x / 50) * 50, y: Math.round(position.y / 50) * 50 });

    for (let i = 0; i < 20; i += 1) {
      const result = findRandomFreePosition({ size, max, others: [], gap: 10, normalize: snapToGrid, step: 50 });

      expect(result!.x % 50).toBe(0);
      expect(result!.y % 50).toBe(0);
    }
  });

  it("uses the random source to choose among free spots", () => {
    const first = findRandomFreePosition({ size, max, others: [], gap: 10, normalize: clamp, step: 100, random: () => 0 });
    const last = findRandomFreePosition({ size, max, others: [], gap: 10, normalize: clamp, step: 100, random: () => 0.999 });

    expect(first).toEqual({ x: 0, y: 0 });
    expect(last).toEqual(max);
  });

  it("falls back to a spot exactly gap away from a neighbor when the grid has none", () => {
    // 그리드(250 간격: x = 0, 250, 500)로는 어디에 놓아도 겹치지만, 왼쪽 위젯 바로 옆(gap 10)에는 자리가 있다
    const wideMax = { x: 500, y: 0 };
    const others = [
      { x: 0, y: 0, width: 290, height: 100 },
      { x: 450, y: 0, width: 150, height: 100 },
    ];
    const snapToGrid = (position: Position) =>
      clampPosition({ x: Math.round(position.x / 250) * 250, y: Math.round(position.y / 250) * 250 }, wideMax);

    const result = findRandomFreePosition({ size, max: wideMax, others, gap: 10, normalize: snapToGrid, step: 250, random: () => 0 });

    expect(result).toEqual({ x: 300, y: 0 });
  });

  it("returns undefined when there is no free spot at all", () => {
    const others = [{ x: 0, y: 0, width: 500, height: 300 }];

    expect(findRandomFreePosition({ size, max, others, gap: 10, normalize: clamp, step: 10 })).toBeUndefined();
  });
});

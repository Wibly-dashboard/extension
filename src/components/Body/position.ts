export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

// 초기 위젯 좌표가 기준으로 삼는 화면 크기 (이 크기에서의 픽셀 좌표를 비율로 변환해 저장)
export const REFERENCE_SIZE: Size = { width: 2560, height: 1271 };

export const clampPosition = (position: Position, max: Position): Position => ({
  x: Math.min(Math.max(0, position.x), max.x),
  y: Math.min(Math.max(0, position.y), max.y),
});

// 픽셀 좌표 -> 컨테이너 대비 비율(0~1). 화면 크기가 바뀌어도 같은 배치를 유지하도록 저장 형식으로 사용
export const toRatio = (position: Position, size: Size): Position => ({
  x: position.x / Math.max(1, size.width),
  y: position.y / Math.max(1, size.height),
});

// 비율 -> 현재 컨테이너 크기에 맞는 픽셀 좌표
export const toPixel = (ratio: Position, size: Size): Position => ({
  x: ratio.x * size.width,
  y: ratio.y * size.height,
});

export type Rect = Position & Size;

/** 두 위젯이 겹치거나 gap보다 가까이 붙어 있는지 확인한다 (정확히 gap만큼 떨어져 있으면 충돌이 아니다) */
export const isColliding = (a: Rect, b: Rect, gap: number) =>
  a.x < b.x + b.width + gap && a.x + a.width > b.x - gap && a.y < b.y + b.height + gap && a.y + a.height > b.y - gap;

type FindFreePositionOptions = {
  /** 놓으려는 위치 (이미 경계·그리드 보정이 끝난 값) */
  desired: Position;
  /** 옮기는 위젯 크기 */
  size: Size;
  /** 위젯이 놓일 수 있는 최대 좌표 (컨테이너 크기 - 위젯 크기) */
  max: Position;
  /** 다른 위젯들의 사각형 */
  others: Rect[];
  gap: number;
  /** 후보 좌표를 실제로 놓일 위치로 보정 (그리드 정렬 + 경계 안으로 제한) */
  normalize: (position: Position) => Position;
  /** 그리드 정렬이 켜져 있으면 그리드 크기. 꺼져 있으면 undefined */
  gridStep?: number;
};

const squaredDistance = (a: Position, b: Position) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * 원하는 위치가 다른 위젯과 겹치면, 그 위치에서 가장 가까운 빈자리를 찾는다. 빈자리가 없으면 undefined.
 *
 * 가장 가까운 빈자리는 각 축의 좌표가 원래 좌표이거나, 컨테이너 끝이거나, 다른 위젯 바로 옆(gap만큼 떨어진 곳)인
 * 조합 중에 있다. 그리드 정렬이 켜져 있으면 이 후보들이 그리드로 옮겨지며 다시 겹칠 수 있으므로 그리드 위의 점도 함께 살펴본다.
 * 거리는 보정까지 끝난 실제 후보 위치로 잰다.
 */
export const findNearestFreePosition = ({
  desired,
  size,
  max,
  others,
  gap,
  normalize,
  gridStep,
}: FindFreePositionOptions): Position | undefined => {
  const isFree = (position: Position) => !others.some((other) => isColliding({ ...position, ...size }, other, gap));

  if (isFree(desired)) return desired;

  const xs = new Set([desired.x, 0, max.x]);
  const ys = new Set([desired.y, 0, max.y]);

  for (const other of others) {
    xs.add(other.x - size.width - gap);
    xs.add(other.x + other.width + gap);
    ys.add(other.y - size.height - gap);
    ys.add(other.y + other.height + gap);
  }

  if (gridStep && gridStep > 0) {
    for (let x = 0; x <= max.x; x += gridStep) xs.add(x);
    for (let y = 0; y <= max.y; y += gridStep) ys.add(y);
  }

  let best: Position | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const x of xs) {
    if (x < 0 || x > max.x) continue;

    for (const y of ys) {
      if (y < 0 || y > max.y) continue;

      const candidate = normalize({ x, y });
      const distance = squaredDistance(candidate, desired);

      // 이미 찾은 후보보다 멀면 충돌 검사를 생략
      if (distance >= bestDistance || !isFree(candidate)) continue;

      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
};

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
  /** 빈자리에 놓았을 때, 다른 위젯 옆자리(gap 간격)나 컨테이너 끝이 이 거리(px) 안에 있으면 그쪽에 붙인다. 없거나 0이면 붙이지 않는다 */
  snapThreshold?: number;
};

const squaredDistance = (a: Position, b: Position) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** 두 구간 [aStart, aStart + aLength), [bStart, bStart + bLength)가 gap 안쪽으로 겹치는지 */
const overlapsWithin = (aStart: number, aLength: number, bStart: number, bLength: number, gap: number) =>
  aStart < bStart + bLength + gap && aStart + aLength > bStart - gap;

/**
 * 한 축에서 desired 좌표와 threshold 안에 있는 가장 가까운 "붙일 자리"를 찾는다.
 * 붙일 자리는 컨테이너 끝(0, max)과, 다른 축으로 겹쳐 있는 위젯의 바로 앞·뒤(gap 간격)다.
 */
const findSnapCoordinate = (
  desired: number,
  candidates: number[],
  max: number,
  threshold: number,
): number | undefined => {
  let best: number | undefined;

  for (const candidate of candidates) {
    if (candidate < 0 || candidate > max) continue;

    const distance = Math.abs(candidate - desired);

    if (distance <= threshold && (best === undefined || distance < Math.abs(best - desired))) best = candidate;
  }

  return best;
};

/**
 * 빈자리에 놓은 위젯을 근처의 다른 위젯 옆자리(정확히 gap 간격)나 컨테이너 끝에 붙인다.
 * 붙인 결과가 다른 위젯과 겹치면 붙이지 않는다.
 */
const snapToNeighbors = (
  desired: Position,
  size: Size,
  max: Position,
  others: Rect[],
  gap: number,
  threshold: number,
  isFree: (position: Position) => boolean,
): Position => {
  const xCandidates = [0, max.x];
  const yCandidates = [0, max.y];

  for (const other of others) {
    // 세로로 나란히 있는 위젯에만 좌우로 붙이고, 가로로 나란히 있는 위젯에만 위아래로 붙인다
    if (overlapsWithin(desired.y, size.height, other.y, other.height, gap)) {
      xCandidates.push(other.x - size.width - gap, other.x + other.width + gap);
    }

    if (overlapsWithin(desired.x, size.width, other.x, other.width, gap)) {
      yCandidates.push(other.y - size.height - gap, other.y + other.height + gap);
    }
  }

  const x = findSnapCoordinate(desired.x, xCandidates, max.x, threshold);
  const y = findSnapCoordinate(desired.y, yCandidates, max.y, threshold);

  const attempts: Position[] = [
    { x: x ?? desired.x, y: y ?? desired.y },
    { x: desired.x, y: y ?? desired.y },
    { x: x ?? desired.x, y: desired.y },
  ];

  return attempts.find(isFree) ?? desired;
};

/**
 * 원하는 위치가 다른 위젯과 겹치면, 그 위치에서 가장 가까운 빈자리를 찾는다. 빈자리가 없으면 undefined.
 * 겹치지 않으면 snapThreshold 안의 다른 위젯 옆자리나 컨테이너 끝에 붙인다.
 *
 * 가장 가까운 빈자리는 각 축의 좌표가 원래 좌표이거나, 컨테이너 끝이거나, 다른 위젯 바로 옆(gap만큼 떨어진 곳)인
 * 조합 중에 있다. 컨테이너 끝과 위젯 옆자리 좌표는 그리드로 옮기지 않아 위젯 사이 간격이 항상 정확히 gap이 되게 한다.
 * 원래 좌표와 그리드 위의 점은 그리드로 보정한다. 거리는 보정까지 끝난 실제 후보 위치로 잰다.
 */
export const findNearestFreePosition = ({
  desired,
  size,
  max,
  others,
  gap,
  normalize,
  gridStep,
  snapThreshold = 0,
}: FindFreePositionOptions): Position | undefined => {
  const isFree = (position: Position) => !others.some((other) => isColliding({ ...position, ...size }, other, gap));

  if (isFree(desired)) {
    return snapThreshold > 0 ? snapToNeighbors(desired, size, max, others, gap, snapThreshold, isFree) : desired;
  }

  // 좌표 -> 정확한 값으로 둘지(true) 그리드로 보정할지(false)
  const xs = new Map<number, boolean>();
  const ys = new Map<number, boolean>();
  const addCoordinate = (map: Map<number, boolean>, value: number, exact: boolean) =>
    map.set(value, (map.get(value) ?? false) || exact);

  addCoordinate(xs, desired.x, false);
  addCoordinate(ys, desired.y, false);

  for (const value of [0, max.x]) addCoordinate(xs, value, true);
  for (const value of [0, max.y]) addCoordinate(ys, value, true);

  for (const other of others) {
    addCoordinate(xs, other.x - size.width - gap, true);
    addCoordinate(xs, other.x + other.width + gap, true);
    addCoordinate(ys, other.y - size.height - gap, true);
    addCoordinate(ys, other.y + other.height + gap, true);
  }

  if (gridStep && gridStep > 0) {
    for (let x = 0; x <= max.x; x += gridStep) addCoordinate(xs, x, false);
    for (let y = 0; y <= max.y; y += gridStep) addCoordinate(ys, y, false);
  }

  let best: Position | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [x, exactX] of xs) {
    if (x < 0 || x > max.x) continue;

    for (const [y, exactY] of ys) {
      if (y < 0 || y > max.y) continue;

      const normalized = normalize({ x, y });
      const candidate = { x: exactX ? x : normalized.x, y: exactY ? y : normalized.y };
      const distance = squaredDistance(candidate, desired);

      // 이미 찾은 후보보다 멀면 충돌 검사를 생략
      if (distance >= bestDistance || !isFree(candidate)) continue;

      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
};

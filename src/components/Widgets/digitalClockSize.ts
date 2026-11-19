export const MIN_CLOCK_SIZE = 1;
export const MAX_CLOCK_SIZE = 2;
export const CLOCK_SIZE_STEP = 0.1;

export const DEFAULT_CLOCK_SIZE = MIN_CLOCK_SIZE;

/** 저장된 값이 올바른 크기가 아니면 기본값을, 범위를 벗어나면 가까운 경계값을 사용한다 (0.1 단위로 맞춘다) */
export const parseClockSize = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_CLOCK_SIZE;

  const clamped = Math.min(MAX_CLOCK_SIZE, Math.max(MIN_CLOCK_SIZE, value));

  return Math.round(clamped * 10) / 10;
};

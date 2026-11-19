export const DEFAULT_IMAGE_URL = "https://dummyimage.com/600x600/ffffff/000000&text=Hello+World!";

/** 너비·높이 슬라이더 범위 (px) */
export const IMAGE_SIZE_RANGE = { min: 100, max: 600, step: 10 } as const;

export const DEFAULT_IMAGE_SIZE = 300;

/** 위젯에 업로드한 이미지를 저장할 때 긴 변의 최대 크기 (최대 표시 크기의 2배로 선명도 유지) */
export const IMAGE_UPLOAD_MAX_DIMENSION = IMAGE_SIZE_RANGE.max * 2;

/** 저장된 값이 숫자가 아니면 기본값을, 범위를 벗어나면 가까운 경계값을 사용한다 (step 단위로 맞춘다) */
export const parseImageSize = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_IMAGE_SIZE;

  const { min, max, step } = IMAGE_SIZE_RANGE;
  const clamped = Math.min(max, Math.max(min, value));

  return Math.round(clamped / step) * step;
};

/** http(s) 주소나 업로드한 이미지(data URL)만 허용하고, 아니면 기본 이미지를 사용한다 */
export const parseImageUrl = (value: unknown): string =>
  typeof value === "string" && /^(https?:\/\/|data:image\/)/i.test(value.trim()) ? value.trim() : DEFAULT_IMAGE_URL;

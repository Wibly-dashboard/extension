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

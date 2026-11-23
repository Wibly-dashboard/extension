import { REFERENCE_SIZE, type Size } from "./position";

/**
 * 위젯 최소 배율.
 * 기준 화면(2560×1271)에 비례해 줄이기만 하면 작은 화면에서는 글자를 읽을 수 없을 만큼 작아지므로 이보다 작게는 줄이지 않는다.
 * 최소 배율에 걸리는 작은 화면에서는 위젯이 화면 비율보다 조금 크게 보이지만, 위치는 계속 영역 안으로 보정된다
 */
export const MIN_WIDGET_SCALE = 0.4;

/** 기준 화면보다 큰 화면(4K 등)에서 위젯이 지나치게 커지지 않도록 하는 최대 배율 */
export const MAX_WIDGET_SCALE = 1.5;

/**
 * 기준 화면(REFERENCE_SIZE)에서 디자인한 위젯을 현재 화면 크기에 맞게 줄이거나 키울 배율.
 *
 * 기준 크기는 모니터 해상도(물리 픽셀) 기준이므로, 브라우저 창 크기(CSS 픽셀)에 기기 픽셀 비율을 곱해 비교한다.
 * 예) 2560×1440 모니터 + Windows 배율 150% → 창 크기는 1707×791(CSS px)이지만 물리 픽셀로는 2560×1186이라 거의 줄이지 않는다.
 * CSS 픽셀로만 비교하면 OS 배율로 이미 커진 화면을 작은 화면으로 착각해 위젯을 한 번 더 줄이게 된다.
 *
 * 너비·높이 비율 중 작은 쪽을 써서 위젯이 어느 방향으로도 화면을 넘치지 않게 하고,
 * 위치(비율 좌표)와 크기가 같은 비율로 바뀌므로 기준 화면에서 맞춰 둔 배치와 정렬이 그대로 유지된다
 */
export const getWidgetScale = (viewport: Size, devicePixelRatio = 1): number => {
  if (viewport.width <= 0 || viewport.height <= 0) return 1;

  const pixelRatio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const fit = Math.min(
    (viewport.width * pixelRatio) / REFERENCE_SIZE.width,
    (viewport.height * pixelRatio) / REFERENCE_SIZE.height,
  );

  // 소수점 셋째 자리까지만 사용해, 창 크기를 1px씩 바꿀 때마다 위젯이 다시 그려지지 않게 한다
  return Math.round(Math.min(MAX_WIDGET_SCALE, Math.max(MIN_WIDGET_SCALE, fit)) * 1000) / 1000;
};

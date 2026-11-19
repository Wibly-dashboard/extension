export const DEFAULT_CLOCK_FONT_COLOR = "#ffffff";

/** 저장된 값이 #rrggbb 형식의 색상이 아니면 기본값(흰색)을 사용한다 */
export const parseClockFontColor = (value: unknown): string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_CLOCK_FONT_COLOR;

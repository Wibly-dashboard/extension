/** 저장된 값이 #rrggbb 형식의 색상이 아니면 기본값을 사용한다 */
export const parseHexColor = (value: unknown, defaultValue: string): string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : defaultValue;

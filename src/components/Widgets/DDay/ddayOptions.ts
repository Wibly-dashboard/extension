export const DDAY_TITLE_MAX_LENGTH = 24;

export const DEFAULT_DDAY_TITLE = "새 목표";

export const DEFAULT_DDAY_TARGET_DATE = "2026-12-31";

/** 새로 추가한 D-Day 위젯의 기본 색상 */
export const DEFAULT_DDAY_TEXT_COLOR = "#1f2937";
export const DEFAULT_DDAY_REMAINING_COLOR = "#4285f4";
export const DEFAULT_DDAY_BACKGROUND_COLOR = "#ffffff";

/** 위젯에 표시할 제목. 비어 있으면 기본 제목을 사용한다 */
export const parseDdayTitle = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, DDAY_TITLE_MAX_LENGTH)
    : DEFAULT_DDAY_TITLE;

/** 편집 창에 입력한 제목 원문 (입력 중인 공백이 사라지지 않도록 다듬지 않는다) */
export const parseDdayTitleInput = (value: unknown): string => (typeof value === "string" ? value : DEFAULT_DDAY_TITLE);

/** YYYY-MM-DD 형식의 실제 존재하는 날짜가 아니면 기본값을 사용한다 */
export const parseDdayDate = (value: unknown, defaultValue: string = DEFAULT_DDAY_TARGET_DATE): string => {
  if (typeof value !== "string") return defaultValue;

  const [year, month, day] = value.split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return defaultValue;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : defaultValue;
};

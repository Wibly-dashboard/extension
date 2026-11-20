import { parseHexColor } from "../shared/parseHexColor";

/** 편집 창 슬라이더 범위와 새로 추가한 포모도로 위젯의 기본값 */
export const FOCUS_MINUTES_RANGE = { min: 1, max: 90, step: 1 } as const;
export const BREAK_MINUTES_RANGE = { min: 1, max: 30, step: 1 } as const;
export const SESSION_COUNT_RANGE = { min: 1, max: 8, step: 1 } as const;

export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_SESSION_COUNT = 4;
export const DEFAULT_POMODORO_TIMER_COLOR = "#1f2937";

type Range = { min: number; max: number };

/** 범위 안의 정수가 아니면 기본값을 사용한다 */
const parseInteger = (value: unknown, { min, max }: Range, defaultValue: number): number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : defaultValue;

export const parseFocusMinutes = (value: unknown): number =>
  parseInteger(value, FOCUS_MINUTES_RANGE, DEFAULT_FOCUS_MINUTES);

export const parseBreakMinutes = (value: unknown): number =>
  parseInteger(value, BREAK_MINUTES_RANGE, DEFAULT_BREAK_MINUTES);

export const parseSessionCount = (value: unknown): number =>
  parseInteger(value, SESSION_COUNT_RANGE, DEFAULT_SESSION_COUNT);

export const parsePomodoroTimerColor = (value: unknown): string =>
  parseHexColor(value, DEFAULT_POMODORO_TIMER_COLOR);

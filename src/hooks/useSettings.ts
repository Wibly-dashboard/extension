import type { DashboardSettings } from "../types/settings";
import { createLocalStore, useLocalStore } from "./localStore";

export const GRID_SIZE_RANGE = { min: 5, max: 100, step: 5 };
export const WIDGET_GAP_RANGE = { min: 0, max: 50, step: 1 };

export const DEFAULT_BACKGROUND_URL =
  "https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?auto=format&fit=crop&fm=webp&q=70&w=1600";

export const DEFAULT_SETTINGS: DashboardSettings = {
  gridSnap: true,
  gridSize: 25,
  widgetGap: 10,
  linkTarget: "_self",
  background: { type: "default" },
};

const clamp = (value: unknown, range: { min: number; max: number }, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(range.max, Math.max(range.min, value)) : fallback;

// 저장된 값에 누락되거나 잘못된 항목이 있어도 기본값으로 보정
const parseSettings = (saved: unknown): DashboardSettings => {
  const merged = { ...DEFAULT_SETTINGS, ...(saved && typeof saved === "object" ? saved : {}) };

  return {
    ...merged,
    gridSize: clamp(merged.gridSize, GRID_SIZE_RANGE, DEFAULT_SETTINGS.gridSize),
    widgetGap: clamp(merged.widgetGap, WIDGET_GAP_RANGE, DEFAULT_SETTINGS.widgetGap),
  };
};

export const settingsStore = createLocalStore<DashboardSettings>("dashboard-settings", parseSettings);

/** 현재 대시보드 설정. 설정이 저장되면 사용하는 컴포넌트가 즉시 다시 렌더링된다. */
export const useSettings = () => useLocalStore(settingsStore);

import type { AddedWidget, WidgetOptions, WidgetType } from "../types/widget";
import { createLocalStore, useLocalStore } from "./localStore";

const parseAddedWidgets = (saved: unknown): AddedWidget[] => (Array.isArray(saved) ? (saved as AddedWidget[]) : []);

export const addedWidgetsStore = createLocalStore<AddedWidget[]>("dashboard-added-widgets", parseAddedWidgets);

/** 위젯 라이브러리에서 추가한 위젯 목록. 추가/제거 시 사용하는 컴포넌트가 즉시 다시 렌더링된다. */
export const useAddedWidgets = () => useLocalStore(addedWidgetsStore);

/**
 * 편집 창에서 정한 옵션으로 위젯을 대시보드에 추가한다.
 * 위치는 비워 두고, 대시보드(BodySection)가 위젯 크기를 잰 뒤 그리드·간격·충돌을 지키는 빈자리 중 임의 위치에 놓는다.
 * allowMultiple이 false면 같은 종류의 위젯이 이미 있을 때 추가하지 않는다
 */
export const addWidget = (type: WidgetType, allowMultiple = false, options: WidgetOptions = {}) => {
  const widgets = addedWidgetsStore.get();
  if (!allowMultiple && widgets.some((widget) => widget.type === type)) return;

  addedWidgetsStore.set([
    ...widgets,
    {
      // 제거 후 다시 추가하면 이전 위치 대신 새 임의 위치에 놓이도록 매번 새 ID 사용
      // (여러 개 추가 가능한 위젯을 빠르게 연달아 추가해도 겹치지 않도록 임의 값을 덧붙인다)
      id: `library-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      options,
    },
  ]);
};

/** 해당 종류의 위젯을 대시보드에서 모두 제거한다 */
export const removeWidget = (type: WidgetType) => {
  addedWidgetsStore.set(addedWidgetsStore.get().filter((widget) => widget.type !== type));
};

/** 대시보드에 놓인 위젯을 삭제한다 */
export const deleteWidget = (id: string) => {
  addedWidgetsStore.set(addedWidgetsStore.get().filter((widget) => widget.id !== id));
};

/** 새로 추가한 위젯의 자리를 정한다 (위젯 ID -> 움직일 수 있는 공간 대비 비율 위치) */
export const placeWidgets = (positions: Record<string, { x: number; y: number }>) => {
  addedWidgetsStore.set(
    addedWidgetsStore
      .get()
      .map((widget) => (positions[widget.id] ? { ...widget, position: positions[widget.id] } : widget)),
  );
};

/** 대시보드에 놓인 위젯의 편집 옵션을 바꾼다 (기존 옵션에 덮어쓴다) */
export const updateWidgetOptions = (id: string, options: WidgetOptions) => {
  addedWidgetsStore.set(
    addedWidgetsStore
      .get()
      .map((widget) => (widget.id === id ? { ...widget, options: { ...widget.options, ...options } } : widget)),
  );
};

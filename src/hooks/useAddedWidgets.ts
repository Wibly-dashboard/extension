import type { AddedWidget, WidgetOptions, WidgetType } from "../types/widget";
import { createLocalStore, useLocalStore } from "./localStore";

// 새 위젯이 놓일 수 있는 비율 범위. 화면 밖으로 나가는 부분은 BodySection이 표시할 때 경계 안으로 보정한다
const MAX_RANDOM_RATIO = 0.8;

const parseAddedWidgets = (saved: unknown): AddedWidget[] => (Array.isArray(saved) ? (saved as AddedWidget[]) : []);

export const addedWidgetsStore = createLocalStore<AddedWidget[]>("dashboard-added-widgets", parseAddedWidgets);

/** 위젯 라이브러리에서 추가한 위젯 목록. 추가/제거 시 사용하는 컴포넌트가 즉시 다시 렌더링된다. */
export const useAddedWidgets = () => useLocalStore(addedWidgetsStore);

/** 위젯을 대시보드의 임의 위치에 추가한다 (다른 위젯과의 충돌 판정 없음) */
export const addWidget = (type: WidgetType) => {
  const widgets = addedWidgetsStore.get();
  if (widgets.some((widget) => widget.type === type)) return;

  addedWidgetsStore.set([
    ...widgets,
    {
      id: `library-${type}-${Date.now()}`, // 제거 후 다시 추가하면 이전 위치 대신 새 임의 위치에 놓이도록 매번 새 ID 사용
      type,
      position: { x: Math.random() * MAX_RANDOM_RATIO, y: Math.random() * MAX_RANDOM_RATIO },
    },
  ]);
};

export const removeWidget = (type: WidgetType) => {
  addedWidgetsStore.set(addedWidgetsStore.get().filter((widget) => widget.type !== type));
};

/** 대시보드에 놓인 위젯을 삭제한다 */
export const deleteWidget = (id: string) => {
  addedWidgetsStore.set(addedWidgetsStore.get().filter((widget) => widget.id !== id));
};

/** 대시보드에 놓인 위젯의 편집 옵션을 바꾼다 (기존 옵션에 덮어쓴다) */
export const updateWidgetOptions = (id: string, options: WidgetOptions) => {
  addedWidgetsStore.set(
    addedWidgetsStore
      .get()
      .map((widget) => (widget.id === id ? { ...widget, options: { ...widget.options, ...options } } : widget)),
  );
};

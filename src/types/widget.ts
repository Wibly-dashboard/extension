import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export type WidgetType = "clock" | "calendar" | "spotify" | "dday" | "image" | "FastLink" | "pomodoro";

export type Widget = {
  id: string;
  type: WidgetType;
};

/** 위젯별 편집 옵션 (위젯 종류마다 다른 값을 저장한다) */
export type WidgetOptions = Record<string, unknown>;

/** 위젯 라이브러리에서 대시보드에 추가한 위젯 */
export type AddedWidget = Widget & {
  /**
   * 움직일 수 있는 공간 대비 비율(0~1) 위치.
   * 새로 추가한 위젯은 크기를 재기 전이라 비어 있고, 대시보드가 크기를 잰 뒤 그리드·간격·충돌을 지키는 빈자리에 놓는다
   */
  position?: { x: number; y: number };
  /** 편집 창에서 바꾼 옵션 */
  options?: WidgetOptions;
};

export type WidgetEditorFieldsProps = {
  /** 현재 저장된 위젯 옵션 */
  options: WidgetOptions;
  /** 바꾼 옵션만 넘기면 기존 옵션에 합쳐 저장된다 */
  onChange: (options: WidgetOptions) => void;
};

/** 위젯 라이브러리에 노출되는 위젯 하나의 정의 (위젯 폴더의 index.tsx에서 만든다) */
export type WidgetCatalogItem = {
  type: WidgetType;
  name: string;
  description: string;
  icon: IconType;
  /** 아이콘 색 (Tailwind text-* 클래스) */
  color: string;
  /** 작은 아이콘 배경 색 (Tailwind bg-* 클래스) */
  background: string;
  /** 대시보드에 렌더링할 위젯 (편집 창에서 저장한 옵션을 받는다) */
  render: (options: WidgetOptions) => ReactNode;
  /** 편집 창에 표시할 편집 항목. 없으면 편집할 항목이 없다는 안내가 표시된다 */
  editor?: (props: WidgetEditorFieldsProps) => ReactNode;
  /** 위젯을 새로 추가할 때 편집 창에 처음 채워 둘 옵션 (기본: 빈 옵션 = 각 옵션의 기본값) */
  initialOptions?: WidgetOptions;
  /**
   * 위젯을 추가할 수 있는 옵션인지 검사한다. 추가할 수 없으면 이유를 돌려주고, 추가할 수 있으면 null.
   * 없으면 언제든 추가할 수 있다 (예: 빠른 링크는 링크를 입력해야 추가할 수 있다)
   */
  validate?: (options: WidgetOptions) => string | null;
  /** true면 같은 위젯을 대시보드에 여러 개 추가할 수 있다 (기본: 한 개만) */
  allowMultiple?: boolean;
};

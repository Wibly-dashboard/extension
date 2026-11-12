export type WidgetType = "clock" | "todo" | "calendar" | "spotify" | "dday" | "image";

export type Widget = {
  id: string;
  type: WidgetType;
};

/** 위젯 라이브러리에서 대시보드에 추가한 위젯 */
export type AddedWidget = Widget & {
  /** 컨테이너 대비 비율(0~1) 위치 */
  position: { x: number; y: number };
};

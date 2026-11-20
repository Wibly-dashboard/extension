import type { WidgetCatalogItem, WidgetType } from "../../types/widget";
import { clockWidget } from "./Clock";
import { ddayWidget } from "./DDay";
import { fastLinkWidget } from "./FastLink";
import { imageWidget } from "./Image";
import { pomodoroWidget } from "./Pomodoro";
import { spotifyWidget } from "./Spotify";

/**
 * 위젯 라이브러리에 노출되는 위젯 목록 (이 순서대로 표시된다).
 * 새 위젯은 Widgets/<위젯 이름>/ 폴더를 만들고, index.tsx에서 내보낸 항목을 여기에 추가하면 된다
 */
export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  clockWidget,
  spotifyWidget,
  ddayWidget,
  imageWidget,
  fastLinkWidget,
  pomodoroWidget,
];

export const findCatalogItem = (type: WidgetType) => WIDGET_CATALOG.find((item) => item.type === type);

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaSpotify } from "react-icons/fa";
import { MdAccessTime, MdCalendarMonth, MdHourglassBottom, MdImage, MdTaskAlt } from "react-icons/md";
import type { WidgetOptions, WidgetType } from "../../types/widget";
import { DDayWidget } from "../Widgets/DDayWidget";
import { DigitalClock } from "../Widgets/DigitalClock";
import { GoogleCalendarWidget } from "../Widgets/GoogleCalendar";
import { ImageBlock } from "../Widgets/ImageBlock";
import { SpotifyWidget } from "../Widgets/SpotifyWidget";
import { TodoWidget } from "../Widgets/TodoListWidget";
import { BACKGROUND_STYLE_LABELS, BACKGROUND_STYLES, parseBackgroundStyle } from "../Widgets/spotifyBackgroundStyle";
import { OptionSelector } from "../WidgetEditor/OptionSelector";

export type WidgetEditorFieldsProps = {
  /** 현재 저장된 위젯 옵션 */
  options: WidgetOptions;
  /** 바꾼 옵션만 넘기면 기존 옵션에 합쳐 저장된다 */
  onChange: (options: WidgetOptions) => void;
};

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
};

// 위젯 라이브러리에 노출되는 위젯 목록. 새 위젯은 여기에 항목을 추가하면 된다
export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: "clock",
    name: "디지털 시계",
    description: "현재 시간과 날짜, 요일을 크게 보여줍니다.",
    icon: MdAccessTime,
    color: "text-sky-200",
    background: "bg-sky-400/20",
    render: () => <DigitalClock />,
  },
  {
    type: "todo",
    name: "할 일 목록",
    description: "오늘 할 일을 체크하고 진행률을 확인합니다.",
    icon: MdTaskAlt,
    color: "text-emerald-200",
    background: "bg-emerald-400/20",
    render: () => <TodoWidget />,
  },
  {
    type: "calendar",
    name: "캘린더",
    description: "이번 주 일정을 시간대별로 보여줍니다.",
    icon: MdCalendarMonth,
    color: "text-blue-200",
    background: "bg-blue-400/20",
    render: () => <GoogleCalendarWidget />,
  },
  {
    type: "spotify",
    name: "Spotify",
    description: "지금 재생 중인 곡과 재생 컨트롤을 보여줍니다.",
    icon: FaSpotify,
    color: "text-green-200",
    background: "bg-green-400/20",
    render: (options) => <SpotifyWidget backgroundStyle={parseBackgroundStyle(options.backgroundStyle)} />,
    editor: ({ options, onChange }) => (
      <OptionSelector
        label="배경 스타일"
        options={BACKGROUND_STYLES}
        optionLabels={BACKGROUND_STYLE_LABELS}
        value={parseBackgroundStyle(options.backgroundStyle)}
        onChange={(backgroundStyle) => onChange({ backgroundStyle })}
      />
    ),
  },
  {
    type: "dday",
    name: "D-Day",
    description: "목표 날짜까지 남은 날을 계산해 보여줍니다.",
    icon: MdHourglassBottom,
    color: "text-orange-200",
    background: "bg-orange-400/20",
    render: () => <DDayWidget title="새 목표" targetDate="2026-12-31" startDate="2026-11-01" />,
  },
  {
    type: "image",
    name: "이미지",
    description: "좋아하는 사진을 대시보드에 걸어 둡니다.",
    icon: MdImage,
    color: "text-pink-200",
    background: "bg-pink-400/20",
    render: () => (
      <ImageBlock
        imageUrl="https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?auto=format&fit=crop&fm=webp&q=70&w=600"
        altText="이미지 위젯"
      />
    ),
  },
];

export const findCatalogItem = (type: WidgetType) => WIDGET_CATALOG.find((item) => item.type === type);

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaSpotify } from "react-icons/fa";
import { MdAccessTime, MdHourglassBottom, MdImage, MdLink, MdTimer } from "react-icons/md";
import type { WidgetOptions, WidgetType } from "../../types/widget";
import { DDayWidget } from "../Widgets/DDayWidget";
import { DigitalClock } from "../Widgets/DigitalClock";
import { ImageBlock } from "../Widgets/ImageBlock";
import { SpotifyWidget } from "../Widgets/SpotifyWidget";
import { parseClockFontColor } from "../Widgets/digitalClockColor";
import { CLOCK_SIZE_STEP, MAX_CLOCK_SIZE, MIN_CLOCK_SIZE, parseClockSize } from "../Widgets/digitalClockSize";
import {
  DEFAULT_IMAGE_URL,
  IMAGE_SIZE_RANGE,
  IMAGE_UPLOAD_MAX_DIMENSION,
  parseImageSize,
  parseImageUrl,
} from "../Widgets/imageBlockOptions";
import { BACKGROUND_STYLE_LABELS, BACKGROUND_STYLES, parseBackgroundStyle } from "../Widgets/spotifyBackgroundStyle";
import { ImageSourcePicker } from "../WidgetEditor/ImageSourcePicker";
import { OptionSelector } from "../WidgetEditor/OptionSelector";
import { RangeSlider } from "../WidgetEditor/RangeSlider";
import { TextColorPicker } from "../WidgetEditor/TextColorPicker";
import { FastLinkWidget } from "../Widgets/FastLinkWidget";
import {
  parseLinkImageUrl,
  parseLinkName,
  parseLinkUrl,
  parseShowLinkName,
  toLinkHref,
} from "../Widgets/FastLinkWidgetOptions";
import { FastLinkEditor } from "../WidgetEditor/FastLinkEditor";
import {
  DEFAULT_DDAY_BACKGROUND_COLOR,
  DEFAULT_DDAY_REMAINING_COLOR,
  DEFAULT_DDAY_TEXT_COLOR,
  parseDdayColor,
  parseDdayDate,
  parseDdayTitle,
} from "../Widgets/DdayWidgetOptions";
import { DDayEditor } from "../WidgetEditor/DDayEditor";
import { PomodoroWidget } from "../Widgets/PomodoroWidget";
import {
  BREAK_MINUTES_RANGE,
  FOCUS_MINUTES_RANGE,
  SESSION_COUNT_RANGE,
  parseBreakMinutes,
  parseFocusMinutes,
  parsePomodoroTimerColor,
  parseSessionCount,
} from "../Widgets/pomodoroOptions";

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
  /** true면 같은 위젯을 대시보드에 여러 개 추가할 수 있다 (기본: 한 개만) */
  allowMultiple?: boolean;
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
    render: (options) => (
      <DigitalClock size={parseClockSize(options.size)} fontColor={parseClockFontColor(options.fontColor)} />
    ),
    editor: ({ options, onChange }) => (
      <>
        <RangeSlider
          label="크기"
          min={MIN_CLOCK_SIZE}
          max={MAX_CLOCK_SIZE}
          step={CLOCK_SIZE_STEP}
          value={parseClockSize(options.size)}
          onChange={(size) => onChange({ size: parseClockSize(size) })}
          formatValue={(size) => `${size.toFixed(1)}x`}
        />
        <TextColorPicker
          label="글자 색상"
          value={parseClockFontColor(options.fontColor)}
          onChange={(fontColor) => onChange({ fontColor })}
        />
      </>
    ),
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
    allowMultiple: true,
    render: (options) => (
      <DDayWidget
        title={parseDdayTitle(options.title)}
        targetDate={parseDdayDate(options.targetDate)}
        textColor={parseDdayColor(options.textColor, DEFAULT_DDAY_TEXT_COLOR)}
        remainingColor={parseDdayColor(options.remainingColor, DEFAULT_DDAY_REMAINING_COLOR)}
        backgroundColor={parseDdayColor(options.backgroundColor, DEFAULT_DDAY_BACKGROUND_COLOR)}
      />
    ),
    editor: (props) => <DDayEditor {...props} />,
  },
  {
    type: "image",
    name: "이미지",
    description: "좋아하는 사진을 대시보드에 걸어 둡니다.",
    icon: MdImage,
    color: "text-pink-200",
    background: "bg-pink-400/20",
    allowMultiple: true,
    render: (options) => (
      <ImageBlock
        imageUrl={parseImageUrl(options.imageUrl)}
        altText="이미지 위젯"
        width={parseImageSize(options.width)}
        height={parseImageSize(options.height)}
      />
    ),
    editor: ({ options, onChange }) => (
      <>
        <ImageSourcePicker
          label="이미지"
          value={parseImageUrl(options.imageUrl)}
          onChange={(imageUrl) => onChange({ imageUrl })}
          onReset={() => onChange({ imageUrl: DEFAULT_IMAGE_URL })}
          maxDimension={IMAGE_UPLOAD_MAX_DIMENSION}
        />
        <RangeSlider
          label="너비"
          {...IMAGE_SIZE_RANGE}
          value={parseImageSize(options.width)}
          onChange={(width) => onChange({ width: parseImageSize(width) })}
          formatValue={(width) => `${width}px`}
        />
        <RangeSlider
          label="높이"
          {...IMAGE_SIZE_RANGE}
          value={parseImageSize(options.height)}
          onChange={(height) => onChange({ height: parseImageSize(height) })}
          formatValue={(height) => `${height}px`}
        />
      </>
    ),
  },
  {
    type: "FastLink",
    name: "빠른 링크",
    description: "자주 사용하는 링크를 빠르게 접근할 수 있습니다.",
    icon: MdLink,
    color: "text-blue-200",
    background: "bg-blue-400/20",
    allowMultiple: true,
    render: (options) => (
      <FastLinkWidget
        LinkName={parseLinkName(options.linkName)}
        LinkUrl={toLinkHref(parseLinkUrl(options.linkUrl))}
        LinkImageUrl={parseLinkImageUrl(options.linkImageUrl)}
        isShowLinkName={parseShowLinkName(options.isShowLinkName)}
      />
    ),
    editor: (props) => <FastLinkEditor {...props} />,
  },
  {
    type: "pomodoro",
    name: "포모도로 타이머",
    description: "집중과 휴식을 번갈아 반복하며 시간을 관리합니다.",
    icon: MdTimer,
    color: "text-red-200",
    background: "bg-red-400/20",
    render: (options) => {
      const focusMinutes = parseFocusMinutes(options.focusMinutes);
      const breakMinutes = parseBreakMinutes(options.breakMinutes);
      const sessionCount = parseSessionCount(options.sessionCount);

      return (
        <PomodoroWidget
          // 시간·세션 설정이 바뀌면 타이머를 처음부터 다시 시작한다
          key={`${focusMinutes}-${breakMinutes}-${sessionCount}`}
          focusMinutes={focusMinutes}
          breakMinutes={breakMinutes}
          sessionCount={sessionCount}
          timerColor={parsePomodoroTimerColor(options.timerColor)}
        />
      );
    },
    editor: ({ options, onChange }) => (
      <>
        <RangeSlider
          label="집중 시간"
          {...FOCUS_MINUTES_RANGE}
          value={parseFocusMinutes(options.focusMinutes)}
          onChange={(focusMinutes) => onChange({ focusMinutes })}
          formatValue={(minutes) => `${minutes}분`}
        />
        <RangeSlider
          label="휴식 시간"
          {...BREAK_MINUTES_RANGE}
          value={parseBreakMinutes(options.breakMinutes)}
          onChange={(breakMinutes) => onChange({ breakMinutes })}
          formatValue={(minutes) => `${minutes}분`}
        />
        <RangeSlider
          label="세션"
          {...SESSION_COUNT_RANGE}
          value={parseSessionCount(options.sessionCount)}
          onChange={(sessionCount) => onChange({ sessionCount })}
          formatValue={(count) => `${count}회`}
        />
        <TextColorPicker
          label="타이머 글자 색상"
          value={parsePomodoroTimerColor(options.timerColor)}
          onChange={(timerColor) => onChange({ timerColor })}
        />
      </>
    ),
  },
];

export const findCatalogItem = (type: WidgetType) => WIDGET_CATALOG.find((item) => item.type === type);

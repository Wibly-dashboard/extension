import type { WidgetOptions } from "../../types/widget";
import {
  DDAY_TITLE_MAX_LENGTH,
  DEFAULT_DDAY_BACKGROUND_COLOR,
  DEFAULT_DDAY_REMAINING_COLOR,
  DEFAULT_DDAY_TEXT_COLOR,
  parseDdayColor,
  parseDdayDate,
  parseDdayTitleInput,
} from "../Widgets/DdayWidgetOptions";
import { TextColorPicker } from "./TextColorPicker";

type DDayEditorProps = {
  options: WidgetOptions;
  /** 바꾼 옵션만 넘기면 기존 옵션에 합쳐 저장된다 */
  onChange: (options: WidgetOptions) => void;
};

const LABEL = "text-sm font-semibold text-white/80";
const INPUT =
  "min-w-0 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] placeholder:text-white/40 focus:border-white/40 focus:outline-none";

/** D-Day 위젯 편집 항목: 제목, 목표일, 글자·남은 기간·배경 색 */
export const DDayEditor = ({ options, onChange }: DDayEditorProps) => (
  <div className="flex flex-col gap-6">
    {/* 제목 */}
    <div className="flex flex-col gap-2">
      <p className={LABEL}>제목</p>
      <input
        autoFocus
        type="text"
        aria-label="D-Day 제목"
        placeholder="목표 이름 (예: 크리스마스)"
        maxLength={DDAY_TITLE_MAX_LENGTH}
        value={parseDdayTitleInput(options.title)}
        onChange={(event) => onChange({ title: event.target.value })}
        className={INPUT}
      />
    </div>

    {/* 목표일 */}
    <div className="flex flex-col gap-2">
      <p className={LABEL}>목표일</p>
      <input
        type="date"
        aria-label="목표일"
        value={parseDdayDate(options.targetDate)}
        onChange={(event) => {
          // 날짜를 지우거나 잘못 입력한 중간 상태는 저장하지 않는다
          if (parseDdayDate(event.target.value, "") === event.target.value) {
            onChange({ targetDate: event.target.value });
          }
        }}
        className={INPUT}
      />
    </div>

    <TextColorPicker
      label="글자 색"
      value={parseDdayColor(options.textColor, DEFAULT_DDAY_TEXT_COLOR)}
      onChange={(textColor) => onChange({ textColor })}
    />
    <TextColorPicker
      label="남은 기간 글자 색"
      value={parseDdayColor(options.remainingColor, DEFAULT_DDAY_REMAINING_COLOR)}
      onChange={(remainingColor) => onChange({ remainingColor })}
    />
    <TextColorPicker
      label="배경 색"
      value={parseDdayColor(options.backgroundColor, DEFAULT_DDAY_BACKGROUND_COLOR)}
      onChange={(backgroundColor) => onChange({ backgroundColor })}
    />
  </div>
);

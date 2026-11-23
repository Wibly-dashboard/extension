import { MdTimer } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { RangeSlider } from "../../WidgetEditor/RangeSlider";
import { TextColorPicker } from "../../WidgetEditor/TextColorPicker";
import { PomodoroWidget } from "./PomodoroWidget";
import {
  BREAK_MINUTES_RANGE,
  FOCUS_MINUTES_RANGE,
  SESSION_COUNT_RANGE,
  parseBreakMinutes,
  parseFocusMinutes,
  parsePomodoroTimerColor,
  parseSessionCount,
} from "./pomodoroOptions";

export const pomodoroWidget: WidgetCatalogItem = {
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
};

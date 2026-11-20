import { MdAccessTime } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { RangeSlider } from "../../WidgetEditor/RangeSlider";
import { TextColorPicker } from "../../WidgetEditor/TextColorPicker";
import { DigitalClock } from "./DigitalClock";
import { CLOCK_SIZE_STEP, MAX_CLOCK_SIZE, MIN_CLOCK_SIZE, parseClockFontColor, parseClockSize } from "./clockOptions";

export const clockWidget: WidgetCatalogItem = {
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
};

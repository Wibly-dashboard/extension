import { MdHourglassBottom } from "react-icons/md";
import type { WidgetCatalogItem } from "../../../types/widget";
import { parseHexColor } from "../shared/parseHexColor";
import { DDayEditor } from "./DDayEditor";
import { DDayWidget } from "./DDayWidget";
import {
  DEFAULT_DDAY_BACKGROUND_COLOR,
  DEFAULT_DDAY_REMAINING_COLOR,
  DEFAULT_DDAY_TEXT_COLOR,
  parseDdayDate,
  parseDdayTitle,
} from "./ddayOptions";

export const ddayWidget: WidgetCatalogItem = {
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
      textColor={parseHexColor(options.textColor, DEFAULT_DDAY_TEXT_COLOR)}
      remainingColor={parseHexColor(options.remainingColor, DEFAULT_DDAY_REMAINING_COLOR)}
      backgroundColor={parseHexColor(options.backgroundColor, DEFAULT_DDAY_BACKGROUND_COLOR)}
    />
  ),
  editor: (props) => <DDayEditor {...props} />,
};

import useTimeDate from "../../../hooks/useTimeDate";
import { DEFAULT_CLOCK_FONT_COLOR, DEFAULT_CLOCK_SIZE } from "./clockOptions";

const BASE_WIDTH = 520 / 1.5;

type DigitalClockProps = {
  /** 글자 색상 (#rrggbb) */
  fontColor?: string;
  size?: number;
};

export const DigitalClock = ({
  fontColor = DEFAULT_CLOCK_FONT_COLOR,
  size = DEFAULT_CLOCK_SIZE,
}: DigitalClockProps) => {
  const { time, date, daysOfWeek } = useTimeDate();
  const dayOfWeek = daysOfWeek[new Date().getDay()];

  return (
    <div
      className="flex flex-col items-center justify-center gap-0"
      style={{ width: `${BASE_WIDTH * size}px`, color: fontColor }}
    >
      <span className="font-bold" style={{ fontSize: `${50 * size}px` }}>
        {time}
      </span>

      <span className="font-medium" style={{ fontSize: `${20 * size}px` }}>
        {date} ({dayOfWeek})
      </span>
    </div>
  );
};

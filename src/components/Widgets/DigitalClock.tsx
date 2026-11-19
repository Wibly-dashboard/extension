import useTimeDate from "../../hooks/useTimeDate";
import { DEFAULT_CLOCK_SIZE } from "./digitalClockSize";

type DigitalClockProps = {
  fontColor?: string;
  size?: number;
};

export const DigitalClock = ({ fontColor, size = DEFAULT_CLOCK_SIZE }: DigitalClockProps) => {
  const { time, date, daysOfWeek } = useTimeDate();
  const dayOfWeek = daysOfWeek[new Date().getDay()];

  return (
    <div className="flex flex-col items-center justify-center gap-0" style={{ width: `${300 * size}px` }}>
      <span className={`font-bold ${fontColor || "text-white"}`} style={{ fontSize: `${50 * size}px` }}>
        {time}
      </span>

      <span className={`font-medium ${fontColor || "text-white"}`} style={{ fontSize: `${20 * size}px` }}>
        {date} ({dayOfWeek})
      </span>
    </div>
  );
};

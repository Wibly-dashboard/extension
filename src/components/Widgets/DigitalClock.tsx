import useTimeDate from "../../hooks/useTimeDate";

export const DigitalClock = () => {
  const { time, date, daysOfWeek } = useTimeDate();
  const dayOfWeek = daysOfWeek[new Date().getDay()];

  return (
    <div className="flex w-[400px] flex-col items-center justify-center gap-0">
      <span className="text-[50px] font-bold">{time}</span>

      <span className="text-[20px] font-medium">
        {date} ({dayOfWeek})
      </span>
    </div>
  );
};

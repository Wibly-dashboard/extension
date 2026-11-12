import { useMemo } from "react";

type DDayWidgetProps = {
  title: string;
  targetDate: string;
  startDate: string;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export const DDayWidget = ({ title, targetDate, startDate }: DDayWidgetProps) => {
  const { remainingDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = parseDate(targetDate);
    const start = parseDate(startDate);

    if (!target || !start) {
      return { remainingDays: null };
    }

    const remaining = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const total = Math.max(1, (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const elapsed = Math.max(0, Math.min(total, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      remainingDays: remaining,
      progress: Math.round((elapsed / total) * 100),
      formattedDate: target.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    };
  }, [targetDate, startDate]);

  const dDayLabel =
    remainingDays === null
      ? "날짜 오류"
      : remainingDays > 0
        ? `D-${remainingDays}`
        : remainingDays === 0
          ? "D-DAY"
          : `D+${Math.abs(remainingDays)}`;

  return (
    <div className="flex h-[300px] w-[300px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 font-sans text-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between"></div>

      {/* D-Day */}
      <div className="my-auto flex flex-col items-center justify-center">
        <span
          className={`text-center text-[42px] font-bold tracking-tight ${
            dDayLabel === "D-DAY" ? "text-green-500" : "text-[#4285F4]"
          }`}
        >
          {dDayLabel}
        </span>
        <h3 className="mt-1 truncate text-base font-semibold">{title}</h3>
      </div>
    </div>
  );
};

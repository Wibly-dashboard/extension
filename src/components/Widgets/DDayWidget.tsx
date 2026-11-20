import { useMemo } from "react";

type DDayWidgetProps = {
  title: string;
  /** YYYY-MM-DD */
  targetDate: string;
  /** 제목 글자 색 */
  textColor: string;
  /** 남은 기간(D-n) 글자 색 */
  remainingColor: string;
  backgroundColor: string;
};

const DAY_MS = 1000 * 60 * 60 * 24;

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export const DDayWidget = ({ title, targetDate, textColor, remainingColor, backgroundColor }: DDayWidgetProps) => {
  const remainingDays = useMemo(() => {
    const target = parseDate(targetDate);
    if (!target) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 서머타임 등으로 하루 길이가 달라도 날짜 차이가 정수가 되도록 반올림
    return Math.round((target.getTime() - today.getTime()) / DAY_MS);
  }, [targetDate]);

  const dDayLabel =
    remainingDays === null
      ? "날짜 오류"
      : remainingDays > 0
        ? `D-${remainingDays}`
        : remainingDays === 0
          ? "D-DAY"
          : `D+${Math.abs(remainingDays)}`;

  const displayTitle = title.slice(0, 24); // 최대 24자까지 표시, 그 이상은 잘라냄

  return (
    <div
      className="flex h-[150px] w-[240px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 p-4 font-sans shadow-sm"
      style={{ backgroundColor, color: textColor }}
    >
      {/* D-Day */}
      <div className="flex w-full flex-col items-center justify-center text-center">
        <h3 className="text-center text-sm font-semibold">{displayTitle}</h3>
        <span
          className="mt-1 text-center text-5xl font-bold leading-none tracking-tight"
          style={{ color: remainingColor }}
        >
          {dDayLabel}
        </span>
      </div>
    </div>
  );
};

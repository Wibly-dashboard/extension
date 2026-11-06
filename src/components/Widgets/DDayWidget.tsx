import { useMemo } from "react";

type DDayWidgetProps = {
  title?: string;
  targetDate?: string;
  startDate?: string;
};

export const DDayWidget = ({
  title = "프로젝트 출시",
  targetDate = "2026-12-25",
  startDate = "2026-10-01",
}: DDayWidgetProps) => {
  const { remainingDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${targetDate}T00:00:00`);
    const start = new Date(`${startDate}T00:00:00`);

    const remaining = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    const total = Math.max(
      1,
      (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const elapsed = Math.max(
      0,
      Math.min(
        total,
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

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
    remainingDays > 0
      ? `D-${remainingDays}`
      : remainingDays === 0
        ? "D-DAY"
        : `D+${Math.abs(remainingDays)}`;

  return (
    <div className="flex h-[250px] w-[250px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 font-sans text-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between"></div>

      {/* D-Day */}
      <div className="my-auto flex items-center justify-center">
        <span className="text-[42px] font-bold tracking-tight text-[#4285F4] text-center">
          {dDayLabel}
          <h3 className="mt-1 truncate text-base font-semibold">{title}</h3>
        </span>
      </div>
    </div>
  );
};

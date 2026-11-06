import {
  MdChevronLeft,
  MdChevronRight,
  MdSearch,
  MdSettings,
  MdCalendarMonth,
} from "react-icons/md";

const days = [
  { day: "일", date: 1 },
  { day: "월", date: 2 },
  { day: "화", date: 3 },
  { day: "수", date: 4 },
  { day: "목", date: 5 },
  { day: "금", date: 6 },
  { day: "토", date: 7 },
];

const events = [
  {
    day: 1,
    start: 10,
    duration: 1,
    title: "팀 미팅",
    time: "10:00",
    color: "bg-blue-100 text-blue-700",
  },
  {
    day: 2,
    start: 13,
    duration: 1.5,
    title: "프로젝트 기획",
    time: "13:00",
    color: "bg-green-100 text-green-700",
  },
  {
    day: 3,
    start: 9,
    duration: 1,
    title: "디자인 리뷰",
    time: "09:00",
    color: "bg-purple-100 text-purple-700",
  },
  {
    day: 3,
    start: 14,
    duration: 2,
    title: "개발 작업",
    time: "14:00",
    color: "bg-blue-100 text-blue-700",
  },
  {
    day: 4,
    start: 11,
    duration: 1,
    title: "점심 약속",
    time: "11:00",
    color: "bg-orange-100 text-orange-700",
  },
  {
    day: 5,
    start: 15,
    duration: 1,
    title: "회의",
    time: "15:00",
    color: "bg-green-100 text-green-700",
  },
  {
    day: 6,
    start: 10,
    duration: 2,
    title: "개인 프로젝트",
    time: "10:00",
    color: "bg-purple-100 text-purple-700",
  },
];

const hours = Array.from({ length: 11 }, (_, i) => i + 8);

export const GoogleCalendarWidget = () => {
  const today = 4;

  return (
    <div className="flex h-[600px] w-[600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white font-sans text-gray-800 shadow-sm">
      {/* Header */}
      <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <div className="flex items-center gap-3">
          <MdCalendarMonth className="text-3xl text-[#4285F4]" />
          <span className="text-lg font-medium">Calendar</span>
          <button className="ml-2 rounded-md border border-gray-200 px-4 py-1.5 text-sm hover:bg-gray-50">
            오늘
          </button>
          <div className="flex items-center gap-1">
            <MdChevronLeft className="cursor-pointer text-2xl text-gray-500" />
            <MdChevronRight className="cursor-pointer text-2xl text-gray-500" />
          </div>
          <span className="text-lg font-medium">2026년 11월</span>
        </div>

        <div className="flex items-center gap-4 text-xl text-gray-500">
          <MdSearch className="cursor-pointer hover:text-gray-800" />
          <MdSettings className="cursor-pointer hover:text-gray-800" />
          <MdCalendarMonth className="cursor-pointer hover:text-gray-800" />
        </div>
      </header>

      {/* Calendar */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Days */}
        <div className="grid h-[55px] shrink-0 grid-cols-8 border-b border-gray-200">
          <div />
          {days.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center justify-center gap-1"
            >
              <span className="text-[11px] text-gray-500">{day.day}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  day.date === today
                    ? "bg-[#1a73e8] font-semibold text-white"
                    : "text-gray-700"
                }`}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-8">
            {/* Time Labels */}
            <div className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[10px] text-gray-400"
                  style={{
                    top: `${((hour - 8) / 11) * 100}%`,
                  }}
                >
                  {hour === 12
                    ? "오후 12시"
                    : hour < 12
                      ? `오전 ${hour}시`
                      : `오후 ${hour - 12}시`}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day) => (
              <div key={day.date} className="relative border-l border-gray-100">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{
                      top: `${((hour - 8) / 11) * 100}%`,
                    }}
                  />
                ))}

                {/* Events */}
                {events
                  .filter((event) => event.day === day.date)
                  .map((event, index) => (
                    <div
                      key={index}
                      className={`absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-1 text-[10px] leading-tight ${event.color}`}
                      style={{
                        top: `${((event.start - 8) / 11) * 100}%`,
                        height: `${(event.duration / 11) * 100}%`,
                      }}
                    >
                      <p className="font-semibold">{event.title}</p>
                      <p className="mt-0.5 opacity-80">{event.time}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Current Time Indicator */}
          <div
            className="pointer-events-none absolute left-[12.5%] right-0 z-10 flex items-center"
            style={{ top: "31%" }}
          >
            <div className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-[1.5px] flex-1 bg-red-500" />
          </div>
        </div>
      </div>

      {/* Footer */}

      {/* Floating Add Button */}
      <div className="absolute" />
    </div>
  );
};

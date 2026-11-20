import { useEffect, useState } from "react";
import { FaPause, FaPlay, FaRedo } from "react-icons/fa";

type PomodoroWidgetProps = {
  focusMinutes: number;
  breakMinutes: number;
  /** 집중 세션 횟수 */
  sessionCount: number;
  /** 타이머 숫자 색 */
  timerColor: string;
};

type Phase = "focus" | "break" | "done";

type TimerState = {
  phase: Phase;
  /** 현재 세션 번호 (1부터) */
  session: number;
  /** 멈춰 있을 때 남은 시간. 진행 중일 때는 마지막으로 계산한 남은 시간 */
  remainingMs: number;
  /** 진행 중이면 끝나는 시각, 멈춰 있으면 null */
  endAt: number | null;
};

type Durations = { focusMs: number; breakMs: number; sessionCount: number };

const TICK_MS = 250;
const MINUTE_MS = 60 * 1000;
/** 시간이 다 된 뒤 00:00을 보여주는 시간 */
const ZERO_HOLD_MS = 1000;

const PHASE_LABELS: Record<Phase, string> = {
  focus: "집중 시간",
  break: "휴식 시간",
  done: "모든 세션 완료",
};

const createInitialState = (focusMs: number): TimerState => ({
  phase: "focus",
  session: 1,
  remainingMs: focusMs,
  endAt: null,
});

/** 남은 시간을 갱신하고, 시간이 다 되면 다음 단계(집중 → 휴식 → 다음 세션 집중 ...)로 넘어간다 */
const advance = (state: TimerState, now: number, { focusMs, breakMs, sessionCount }: Durations): TimerState => {
  if (state.endAt === null) return state;

  const remainingMs = state.endAt - now;
  // 남은 시간은 초 단위로 올림해 표시하므로, 0초가 된 뒤 1초 동안 00:00을 보여주고 다음 단계로 넘어간다
  if (remainingMs > -ZERO_HOLD_MS) return { ...state, remainingMs: Math.max(0, remainingMs) };

  if (state.phase === "break") {
    return { phase: "focus", session: state.session + 1, remainingMs: focusMs, endAt: now + focusMs };
  }

  // 마지막 집중 세션이 끝나면 휴식 없이 종료
  if (state.session >= sessionCount) {
    return { ...state, phase: "done", remainingMs: 0, endAt: null };
  }

  return { ...state, phase: "break", remainingMs: breakMs, endAt: now + breakMs };
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const BUTTON = "flex cursor-pointer items-center justify-center rounded-full transition-colors duration-200";

/** 진행 링 크기 (px) */
const RING_SIZE = 200;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * 포모도로 타이머 위젯.
 * 집중 시간·휴식 시간·세션 수가 바뀌면 타이머를 처음부터 다시 시작해야 하므로, 사용하는 쪽에서 해당 값으로 key를 지정한다
 */
export const PomodoroWidget = ({ focusMinutes, breakMinutes, sessionCount, timerColor }: PomodoroWidgetProps) => {
  const focusMs = focusMinutes * MINUTE_MS;
  const breakMs = breakMinutes * MINUTE_MS;

  const [state, setState] = useState<TimerState>(() => createInitialState(focusMs));
  const isRunning = state.endAt !== null;

  useEffect(() => {
    if (!isRunning) return;

    const durations = { focusMs, breakMs, sessionCount };
    const id = window.setInterval(() => setState((prev) => advance(prev, Date.now(), durations)), TICK_MS);

    return () => window.clearInterval(id);
  }, [isRunning, focusMs, breakMs, sessionCount]);

  const toggle = () =>
    setState((prev) => {
      const now = Date.now();

      // 모든 세션을 마친 뒤 시작하면 처음부터 다시 시작
      if (prev.phase === "done") return { ...createInitialState(focusMs), endAt: now + focusMs };
      if (prev.endAt !== null) return { ...prev, remainingMs: Math.max(0, prev.endAt - now), endAt: null };

      return { ...prev, endAt: now + prev.remainingMs };
    });

  const reset = () => setState(createInitialState(focusMs));

  // 현재 단계에서 지난 시간 비율 (0~1). 모든 세션을 마치면 가득 찬 상태로 표시
  const phaseTotalMs = state.phase === "focus" ? focusMs : state.phase === "break" ? breakMs : 0;
  const progress = phaseTotalMs > 0 ? 1 - state.remainingMs / phaseTotalMs : 1;

  return (
    <div className="flex h-[300px] w-[300px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 font-sans text-gray-800 shadow-sm">
      {/* 진행 링 + 현재 단계 / 타이머 / 세션 진행 */}
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            className="stroke-gray-100"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={timerColor}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
            style={{ opacity: state.phase === "break" ? 0.5 : 1 }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* 현재 단계 / 타이머 (간격 없이 붙여 표시) */}
          <p className="text-xs font-semibold text-gray-500">{PHASE_LABELS[state.phase]}</p>
          <span className="text-5xl font-bold leading-none tracking-tight tabular-nums" style={{ color: timerColor }}>
            {formatTime(state.remainingMs)}
          </span>

          {/* 세션 진행 */}
          <div
            className="mt-3 flex gap-1.5"
            role="img"
            aria-label={`세션 ${Math.min(state.session, sessionCount)} / ${sessionCount}`}
          >
            {Array.from({ length: sessionCount }, (_, index) => {
              const session = index + 1;
              const isCompleted = state.phase === "done" || session < state.session;
              const isCurrent = state.phase !== "done" && session === state.session;

              return (
                <span
                  key={session}
                  className={`h-1.5 w-1.5 rounded-full ${isCompleted || isCurrent ? "" : "bg-gray-200"}`}
                  style={
                    isCompleted
                      ? { backgroundColor: timerColor }
                      : isCurrent
                        ? { backgroundColor: timerColor, opacity: 0.35 }
                        : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 시작/정지, 리셋 */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={isRunning ? "정지" : "시작"}
          title={isRunning ? "정지" : "시작"}
          onClick={toggle}
          className={`${BUTTON} h-12 w-12 bg-gray-900 text-white hover:bg-gray-700`}
        >
          {isRunning ? <FaPause className="h-4 w-4" /> : <FaPlay className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          type="button"
          aria-label="리셋"
          title="리셋"
          onClick={reset}
          className={`${BUTTON} h-10 w-10 bg-gray-100 text-gray-600 hover:bg-gray-200`}
        >
          <FaRedo className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

import type { ReactNode } from "react";
import { FaCheck } from "react-icons/fa";

type SettingRowProps = {
  title: string;
  description?: string;
  /** true면 컨트롤을 제목 아래 줄에 배치 (색상 팔레트처럼 넓은 컨트롤용) */
  stacked?: boolean;
  children: ReactNode;
};

export const SettingRow = ({ title, description, stacked = false, children }: SettingRowProps) => (
  <div
    className={`flex border-b border-white/15 py-4 last:border-b-0 ${
      stacked ? "flex-col gap-3" : "items-center justify-between gap-6"
    }`}
  >
    <div className="min-w-0">
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-0.5 text-xs text-white/60">{description}</p>}
    </div>
    <div className={stacked ? "" : "shrink-0"}>{children}</div>
  </div>
);

type ToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export const Toggle = ({ checked, label, onChange }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200 ${
      checked ? "bg-blue-500" : "bg-white/25"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

type SliderProps = {
  value: number;
  label: string;
  range: { min: number; max: number; step: number };
  onChange: (value: number) => void;
};

export const Slider = ({ value, label, range, onChange }: SliderProps) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      aria-label={label}
      min={range.min}
      max={range.max}
      step={range.step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1.5 w-40 cursor-pointer accent-blue-500"
    />
    <span className="w-12 text-right text-sm text-white tabular-nums">{value}px</span>
  </div>
);

type SegmentedProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export const Segmented = <T extends string>({ value, options, onChange }: SegmentedProps<T>) => (
  <div className="flex rounded-lg bg-white/10 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
        className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
          option.value === value ? "bg-white font-semibold text-neutral-900" : "text-white/70 hover:text-white"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

// 기본 제공 색. Tailwind가 클래스를 추출할 수 있도록 배경 클래스는 완전한 문자열로 둔다
const PRESET_COLORS = [
  { name: "black", value: "#000000", className: "bg-[#000000]", dark: true },
  { name: "white", value: "#ffffff", className: "bg-[#ffffff]", dark: false },
  { name: "red", value: "#ef4444", className: "bg-[#ef4444]", dark: true },
  { name: "orange", value: "#f97316", className: "bg-[#f97316]", dark: true },
  { name: "yellow", value: "#eab308", className: "bg-[#eab308]", dark: false },
  { name: "green", value: "#22c55e", className: "bg-[#22c55e]", dark: true },
  { name: "cyan", value: "#06b6d4", className: "bg-[#06b6d4]", dark: true },
  { name: "blue", value: "#3b82f6", className: "bg-[#3b82f6]", dark: true },
  { name: "purple", value: "#a855f7", className: "bg-[#a855f7]", dark: true },
  { name: "pink", value: "#ec4899", className: "bg-[#ec4899]", dark: true },
];

type ColorPickerProps = {
  /** 현재 선택된 색(hex). 색이 선택된 상태가 아니면 null */
  value: string | null;
  label: string;
  onChange: (color: string) => void;
};

export const ColorPicker = ({ value, label, onChange }: ColorPickerProps) => {
  const selected = value?.toLowerCase() ?? null;
  const isCustom = selected !== null && !PRESET_COLORS.some((color) => color.value === selected);

  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label={label}>
      {PRESET_COLORS.map((color) => {
        const isSelected = color.value === selected;

        return (
          <button
            key={color.name}
            type="button"
            title={color.name}
            aria-label={color.name}
            aria-pressed={isSelected}
            onClick={() => onChange(color.value)}
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/40 transition-transform duration-150 hover:scale-110 ${color.className} ${
              isSelected ? "outline-2 outline-offset-2 outline-white" : ""
            }`}
          >
            {isSelected && <FaCheck className={`h-3 w-3 ${color.dark ? "text-white" : "text-neutral-900"}`} />}
          </button>
        );
      })}

      {/* 커스텀 색: 무지개 테두리 안의 네이티브 색상 선택기 */}
      <label
        title="커스텀 색"
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] transition-transform duration-150 hover:scale-110 ${
          isCustom ? "outline-2 outline-offset-2 outline-white" : ""
        }`}
      >
        <input
          type="color"
          aria-label={`${label} 커스텀 색`}
          value={selected ?? "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="h-5 w-5 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
      </label>
      {isCustom && <span className="text-xs text-white/70 uppercase">{selected}</span>}
    </div>
  );
};

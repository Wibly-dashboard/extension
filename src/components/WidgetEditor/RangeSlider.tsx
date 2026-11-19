type RangeSliderProps = {
  /** 편집 항목 이름 */
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** 현재 값 옆에 표시할 문자열 (기본값: 숫자 그대로) */
  formatValue?: (value: number) => string;
};

/** 범위 안의 숫자를 고르는 편집 항목 (슬라이더) */
export const RangeSlider = ({ label, min, max, step, value, onChange, formatValue = String }: RangeSliderProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-white/80">{label}</p>
      <span className="text-sm text-white/60 tabular-nums">{formatValue(value)}</span>
    </div>
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full cursor-pointer accent-white"
    />
  </div>
);

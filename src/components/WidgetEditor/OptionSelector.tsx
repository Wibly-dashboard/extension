type OptionSelectorProps<T extends string> = {
  /** 편집 항목 이름 */
  label: string;
  options: readonly T[];
  /** 각 옵션에 표시할 이름 */
  optionLabels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

/** 여러 값 중 하나를 고르는 편집 항목 (세그먼트 버튼) */
export const OptionSelector = <T extends string>({
  label,
  options,
  optionLabels,
  value,
  onChange,
}: OptionSelectorProps<T>) => (
  <div className="flex flex-col gap-2">
    <p className="text-sm font-semibold text-white/80">{label}</p>
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl border border-white/15 bg-white/10 p-1">
      {options.map((option) => {
        const isSelected = option === value;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option)}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
              isSelected ? "bg-white/25 font-semibold text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {optionLabels[option]}
          </button>
        );
      })}
    </div>
  </div>
);

import { ColorPicker } from "../Settings/Controls";

type TextColorPickerProps = {
  /** 편집 항목 이름 */
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** 텍스트 색상을 고르는 편집 항목 (설정의 배경 색 선택과 같은 팔레트 + 커스텀 색) */
export const TextColorPicker = ({ label, value, onChange }: TextColorPickerProps) => (
  <div className="flex flex-col gap-2">
    <p className="text-sm font-semibold text-white/80">{label}</p>
    <ColorPicker label={label} value={value} onChange={onChange} />
  </div>
);

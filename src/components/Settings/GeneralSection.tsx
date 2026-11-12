import { useRef, useState } from "react";
import { FaUpload } from "react-icons/fa";
import { GRID_SIZE_RANGE, WIDGET_GAP_RANGE } from "../../hooks/useSettings";
import type { DashboardSettings, LinkTarget } from "../../types/settings";
import { ColorPicker, Segmented, SettingRow, Slider, Toggle } from "./Controls";
import { imageFileToDataUrl } from "./imageFile";

type GeneralSectionProps = {
  settings: DashboardSettings;
  onChange: (patch: Partial<DashboardSettings>) => void;
};

const LINK_TARGET_OPTIONS: { value: LinkTarget; label: string }[] = [
  { value: "_blank", label: "새 탭" },
  { value: "_self", label: "현재 탭" },
];

const BACKGROUND_LABEL = {
  default: "기본 배경 이미지 사용 중",
  color: "단색 배경 사용 중",
  image: "업로드한 이미지 사용 중",
};

export const GeneralSection = ({ settings, onChange }: GeneralSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { background } = settings;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      onChange({ background: { type: "image", value: await imageFileToDataUrl(file) } });
      setUploadError(null);
    } catch {
      setUploadError("이미지를 불러오지 못했습니다. 다른 파일을 선택해 주세요.");
    }
  };

  return (
    <div>
      <SettingRow title="그리드 정렬" description="위젯을 놓을 때 그리드에 맞춰 정렬합니다">
        <Toggle label="그리드 정렬" checked={settings.gridSnap} onChange={(gridSnap) => onChange({ gridSnap })} />
      </SettingRow>

      {settings.gridSnap && (
        <SettingRow title="그리드 크기" description="그리드 한 칸의 크기 (기본 25px)">
          <Slider
            label="그리드 크기"
            value={settings.gridSize}
            range={GRID_SIZE_RANGE}
            onChange={(gridSize) => onChange({ gridSize })}
          />
        </SettingRow>
      )}

      <SettingRow title="위젯 간격" description="위젯 사이에 유지할 최소 간격 (기본 10px)">
        <Slider
          label="위젯 간격"
          value={settings.widgetGap}
          range={WIDGET_GAP_RANGE}
          onChange={(widgetGap) => onChange({ widgetGap })}
        />
      </SettingRow>

      <SettingRow title="웹 사이트 열기" description="링크를 눌렀을 때 사이트를 여는 위치">
        <Segmented
          value={settings.linkTarget}
          options={LINK_TARGET_OPTIONS}
          onChange={(linkTarget) => onChange({ linkTarget })}
        />
      </SettingRow>

      <SettingRow
        title="글자 색"
        description="대시보드 글자 색을 지정합니다. 위젯에 따라 적용이 다를 수 있습니다."
        stacked
      >
        <ColorPicker label="글자 색" value={settings.fontColor} onChange={(fontColor) => onChange({ fontColor })} />
      </SettingRow>

      <SettingRow title="배경" description={BACKGROUND_LABEL[background.type]} stacked>
        <div className="flex flex-col gap-3">
          <ColorPicker
            label="배경 색"
            value={background.type === "color" ? background.value : null}
            onChange={(value) => onChange({ background: { type: "color", value } })}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = ""; // 같은 파일을 다시 선택할 수 있도록 초기화
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm text-white transition-colors duration-200 hover:bg-white/25"
            >
              <FaUpload className="h-3 w-3" />
              이미지 업로드
            </button>
            <button
              type="button"
              disabled={background.type === "default"}
              onClick={() => onChange({ background: { type: "default" } })}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              기본 배경으로
            </button>
            {background.type === "image" && (
              <img
                src={background.value}
                alt="업로드한 배경 미리보기"
                className="h-9 w-16 rounded-md border border-white/40 object-cover"
              />
            )}
          </div>

          {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}
        </div>
      </SettingRow>
    </div>
  );
};

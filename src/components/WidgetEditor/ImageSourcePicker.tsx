import { useRef, useState } from "react";
import { FaUpload } from "react-icons/fa";
import { imageFileToDataUrl } from "../Settings/imageFile";

type ImageSourcePickerProps = {
  /** 편집 항목 이름 */
  label: string;
  /** 현재 이미지 주소 (http(s) 또는 data URL) */
  value: string;
  onChange: (value: string) => void;
  /** 기본 이미지로 되돌리기. 없으면 버튼을 표시하지 않는다 */
  onReset?: () => void;
  /** 업로드한 이미지를 저장할 때 긴 변의 최대 크기 (px) */
  maxDimension?: number;
};

/** 이미지를 파일 업로드 또는 주소 입력으로 바꾸는 편집 항목 */
export const ImageSourcePicker = ({ label, value, onChange, onReset, maxDimension }: ImageSourcePickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(value.startsWith("data:") ? "" : value);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      onChange(await imageFileToDataUrl(file, maxDimension));
      setUrlDraft("");
      setError(null);
    } catch {
      setError("이미지를 불러오지 못했습니다. 다른 파일을 선택해 주세요.");
    }
  };

  const applyUrl = () => {
    const url = urlDraft.trim();

    if (!/^https?:\/\//i.test(url)) {
      setError("http:// 또는 https://로 시작하는 이미지 주소를 입력해 주세요.");
      return;
    }

    onChange(url);
    setError(null);
  };

  return (
    <div className="mb-5 flex flex-col gap-2">
      <p className="text-sm font-semibold text-white/80">{label}</p>

      <div className="flex items-center gap-3">
        <img
          src={value}
          alt="현재 이미지 미리보기"
          className="h-14 w-14 shrink-0 rounded-lg border border-white/30 object-cover"
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
          {onReset && (
            <button
              type="button"
              onClick={() => {
                onReset();
                setUrlDraft("");
                setError(null);
              }}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
            >
              기본 이미지로
            </button>
          )}
        </div>
      </div>

      <form
        className="flex gap-2 mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          applyUrl();
        }}
      >
        <input
          type="url"
          aria-label={`${label} 주소`}
          placeholder="이미지 주소 붙여넣기"
          value={urlDraft}
          onChange={(event) => setUrlDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!urlDraft.trim()}
          className="shrink-0 cursor-pointer rounded-lg bg-white/15 px-3 py-2 text-sm text-white transition-colors duration-200 hover:bg-white/25 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white/15"
        >
          적용
        </button>
      </form>

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
};

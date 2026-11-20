import { useEffect, useRef, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { findSiteIcon } from "../../hooks/siteIcon";
import type { WidgetOptions } from "../../types/widget";
import { Toggle } from "../Settings/Controls";
import { FastLinkIcon } from "../Widgets/FastLinkWidget";
import {
  getSiteName,
  parseEdited,
  parseLinkImageUrl,
  parseLinkName,
  parseLinkUrl,
  parseShowLinkName,
} from "../Widgets/FastLinkWidgetOptions";

type FastLinkEditorProps = {
  options: WidgetOptions;
  /** 바꾼 옵션만 넘기면 기존 옵션에 합쳐 저장된다 */
  onChange: (options: WidgetOptions) => void;
};

type IconStatus = "idle" | "loading" | "found" | "failed";

const ICON_DETECT_DELAY_MS = 500;

const LABEL = "text-sm font-semibold text-white/80";
const INPUT =
  "min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";
const AUTO_BUTTON =
  "shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white";

/** 빠른 링크 위젯 편집 항목: 링크를 입력하면 사이트 이름과 아이콘을 자동으로 채우고, 직접 고칠 수도 있다 */
export const FastLinkEditor = ({ options, onChange }: FastLinkEditorProps) => {
  const linkUrl = parseLinkUrl(options.linkUrl);
  const linkName = parseLinkName(options.linkName);
  const linkImageUrl = parseLinkImageUrl(options.linkImageUrl);
  const isShowLinkName = parseShowLinkName(options.isShowLinkName);
  const isNameEdited = parseEdited(options.nameEdited);
  const isIconEdited = parseEdited(options.iconEdited);

  const [iconStatus, setIconStatus] = useState<IconStatus>("idle");
  const timerRef = useRef<number | undefined>(undefined);
  const requestRef = useRef(0); // 이전 요청 결과가 늦게 도착해 최신 결과를 덮어쓰지 않도록 구분

  const cancelDetect = () => {
    window.clearTimeout(timerRef.current);
    requestRef.current += 1;
  };

  // 편집 창을 닫으면 진행 중인 아이콘 찾기를 취소한다
  useEffect(() => cancelDetect, []);

  // 링크 입력이 멈추면 해당 사이트의 아이콘을 찾아 자동으로 채운다
  const detectIcon = (href: string) => {
    cancelDetect();

    if (!href.trim()) {
      setIconStatus("idle");
      return;
    }

    const requestId = requestRef.current;
    setIconStatus("loading");

    timerRef.current = window.setTimeout(async () => {
      const icon = await findSiteIcon(href);
      if (requestId !== requestRef.current) return;

      setIconStatus(icon ? "found" : "failed");
      onChange({ linkImageUrl: icon ?? "" });
    }, ICON_DETECT_DELAY_MS);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 링크 */}
      <div className="flex flex-col gap-2">
        <p className={LABEL}>링크</p>
        <input
          autoFocus
          type="text"
          aria-label="링크 URL"
          placeholder="이동할 링크 (예: naver.com)"
          value={linkUrl}
          onChange={(event) => {
            const href = event.target.value;

            onChange({ linkUrl: href, ...(isNameEdited ? {} : { linkName: getSiteName(href) ?? "" }) });
            if (!isIconEdited) detectIcon(href);
          }}
          className={INPUT}
        />
      </div>

      {/* 사이트 이름 */}
      <div className="flex flex-col gap-2">
        <p className={LABEL}>사이트 이름</p>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="사이트 이름"
            placeholder="위젯에 표시할 이름"
            value={linkName}
            onChange={(event) => onChange({ linkName: event.target.value, nameEdited: true })}
            className={INPUT}
          />
          {isNameEdited && (
            <button
              type="button"
              onClick={() => onChange({ linkName: getSiteName(linkUrl) ?? "", nameEdited: false })}
              className={AUTO_BUTTON}
            >
              자동으로
            </button>
          )}
        </div>
      </div>

      {/* 아이콘 */}
      <div className="flex flex-col gap-2">
        <p className={LABEL}>아이콘</p>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <FastLinkIcon imageUrl={linkImageUrl} className="h-11 w-11 rounded-[10px]" />
            {iconStatus === "loading" && (
              <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/40">
                <FaSpinner className="h-4 w-4 animate-spin text-white" />
              </span>
            )}
          </div>
          <input
            type="text"
            aria-label="아이콘 이미지 URL"
            placeholder="아이콘 이미지 URL (https://...png)"
            value={linkImageUrl}
            onChange={(event) => {
              cancelDetect();
              setIconStatus("idle");
              onChange({ linkImageUrl: event.target.value, iconEdited: true });
            }}
            className={INPUT}
          />
          {isIconEdited && (
            <button
              type="button"
              onClick={() => {
                onChange({ iconEdited: false });
                detectIcon(linkUrl);
              }}
              className={AUTO_BUTTON}
            >
              자동으로
            </button>
          )}
        </div>
        <p className={`text-[11px] ${iconStatus === "failed" ? "text-red-300" : "text-white/50"}`}>
          {iconStatus === "loading" && "사이트 아이콘을 찾는 중..."}
          {iconStatus === "found" && "사이트 아이콘을 자동으로 가져왔습니다."}
          {iconStatus === "failed" && "아이콘을 찾지 못했습니다. 이미지 URL을 직접 입력해 주세요."}
          {iconStatus === "idle" && "링크를 입력하면 사이트 아이콘을 자동으로 가져옵니다."}
        </p>
      </div>

      {/* 이름 표시 여부 */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={LABEL}>사이트 이름 표시</p>
          <p className="mt-0.5 text-xs text-white/50">끄면 위젯이 아이콘 크기로 줄어듭니다.</p>
        </div>
        <Toggle
          checked={isShowLinkName}
          label="사이트 이름 표시"
          onChange={(checked) => onChange({ isShowLinkName: checked })}
        />
      </div>
    </div>
  );
};

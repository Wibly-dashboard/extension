import { useEffect, useRef, useState } from "react";
import { FaLink, FaPen, FaPlus, FaSpinner, FaTrash } from "react-icons/fa";
import { findSiteIcon } from "../../hooks/siteIcon";
import { MAX_NAV_LINKS, normalizeUrl } from "../../hooks/useNavLinks";
import type { NavLink } from "../../types/settings";

type LinksSectionProps = {
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
};

// 추가 중이면 id가 null, 수정 중이면 대상 링크의 id
type Draft = { id: string | null; imageUrl: string; href: string };

const ICON_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white";

const INPUT =
  "w-full min-w-0 rounded-lg border border-white/25 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-white/60";

/** 이미지 주소가 비었거나 불러오지 못하면 링크 아이콘으로 대체해 보여준다 */
const LinkIcon = ({ imageUrl }: { imageUrl: string }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!imageUrl.trim() || failedUrl === imageUrl) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-white/50">
        <FaLink />
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt=""
      draggable={false}
      onError={() => setFailedUrl(imageUrl)}
      className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
    />
  );
};

type LinkFormProps = {
  draft: Draft;
  /** 비동기로 아이콘을 찾은 뒤에도 최신 값 기준으로 반영되도록 업데이트 함수를 받는다 */
  onChange: (update: (draft: Draft) => Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

type IconStatus = "idle" | "loading" | "found" | "failed";

const ICON_DETECT_DELAY_MS = 500;

const LinkForm = ({ draft, onChange, onSubmit, onCancel }: LinkFormProps) => {
  const [iconStatus, setIconStatus] = useState<IconStatus>("idle");
  // 사용자가 이미지 URL을 직접 입력하기로 했는지 (이후로는 자동으로 덮어쓰지 않음)
  const [isManualIcon, setIsManualIcon] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const requestRef = useRef(0); // 이전 요청 결과가 늦게 도착해 최신 결과를 덮어쓰지 않도록 구분

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const cancelDetect = () => {
    window.clearTimeout(timerRef.current);
    requestRef.current += 1;
  };

  // 링크 입력이 멈추면 해당 사이트의 아이콘을 찾아 자동으로 채운다
  const detectIcon = (href: string) => {
    cancelDetect();

    if (isManualIcon) return;
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
      onChange((prev) => ({ ...prev, imageUrl: icon ?? "" }));
    }, ICON_DETECT_DELAY_MS);
  };

  const showIconInput = isManualIcon || iconStatus === "failed";
  const isValid = draft.imageUrl.trim() !== "" && draft.href.trim() !== "";

  return (
    <form
      className="flex items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) onSubmit();
      }}
    >
      {/* 아이콘 미리보기 */}
      <div className="relative">
        <LinkIcon imageUrl={draft.imageUrl} />
        {iconStatus === "loading" && (
          <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/40">
            <FaSpinner className="h-4 w-4 animate-spin text-white" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          autoFocus
          type="text"
          aria-label="링크 URL"
          placeholder="이동할 링크 (예: naver.com)"
          value={draft.href}
          onChange={(event) => {
            const href = event.target.value;

            onChange((prev) => ({ ...prev, href }));
            detectIcon(href);
          }}
          className={INPUT}
        />

        {showIconInput && (
          <input
            autoFocus={iconStatus === "failed"}
            type="text"
            aria-label="아이콘 이미지 URL"
            placeholder="아이콘 이미지 URL (https://...png)"
            value={draft.imageUrl}
            onChange={(event) => {
              const imageUrl = event.target.value;

              cancelDetect();
              setIsManualIcon(true);
              onChange((prev) => ({ ...prev, imageUrl }));
            }}
            className={INPUT}
          />
        )}

        <div className="flex items-center justify-between gap-2">
          <p className={`min-w-0 text-[11px] ${iconStatus === "failed" ? "text-red-300" : "text-white/50"}`}>
            {iconStatus === "loading" && "사이트 아이콘을 찾는 중..."}
            {iconStatus === "found" && !isManualIcon && "사이트 아이콘을 자동으로 가져왔습니다."}
            {iconStatus === "failed" && !isManualIcon && "아이콘을 찾지 못했습니다. 이미지 URL을 직접 입력해 주세요."}
            {!showIconInput && (
              <button
                type="button"
                onClick={() => {
                  cancelDetect();
                  setIconStatus("idle");
                  setIsManualIcon(true);
                }}
                className="ml-1 cursor-pointer text-white/70 underline underline-offset-2 hover:text-white"
              >
                아이콘 직접 입력
              </button>
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isValid || iconStatus === "loading"}
              className="cursor-pointer rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-400 disabled:cursor-default disabled:opacity-40"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export const LinksSection = ({ links, onChange }: LinksSectionProps) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const isAdding = draft !== null && draft.id === null;
  const isFull = links.length >= MAX_NAV_LINKS;
  const updateDraft = (update: (draft: Draft) => Draft) => setDraft((prev) => (prev ? update(prev) : prev));

  const saveDraft = () => {
    if (!draft) return;
    if (draft.id === null && isFull) return;

    const next = { imageUrl: draft.imageUrl.trim(), href: normalizeUrl(draft.href) };

    onChange(
      draft.id === null
        ? [...links, { id: crypto.randomUUID(), ...next }]
        : links.map((link) => (link.id === draft.id ? { ...link, ...next } : link)),
    );
    setDraft(null);
  };

  const removeLink = (id: string) => {
    onChange(links.filter((link) => link.id !== id));
    if (draft?.id === id) setDraft(null);
  };

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-white/60">하단 바에 표시되는 링크 아이콘입니다. 저장을 눌러야 반영됩니다.</p>
          <p className={`text-xs mt-5 ${isFull ? "text-red-300" : "text-white/40"}`}>
            {isFull && `링크는 최대 ${MAX_NAV_LINKS}개까지 추가할 수 있습니다.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ id: null, imageUrl: "", href: "" })}
          disabled={isAdding || isFull}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white transition-colors duration-200 hover:bg-white/25 disabled:cursor-default disabled:opacity-40"
        >
          <FaPlus className="h-3 w-3" />
          링크 추가
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {isAdding && (
          <li className="rounded-xl border border-blue-400/50 bg-white/10 p-4">
            <LinkForm draft={draft} onChange={updateDraft} onSubmit={saveDraft} onCancel={() => setDraft(null)} />
          </li>
        )}

        {links.map((link) => (
          <li key={link.id} className="rounded-xl border border-white/15 bg-white/10 p-4">
            {draft?.id === link.id ? (
              <LinkForm draft={draft} onChange={updateDraft} onSubmit={saveDraft} onCancel={() => setDraft(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <LinkIcon imageUrl={link.imageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{link.href}</p>
                  <p className="truncate text-xs text-white/50">{link.imageUrl}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`${link.href} 링크 수정`}
                    onClick={() => setDraft({ id: link.id, imageUrl: link.imageUrl, href: link.href })}
                    className={ICON_BUTTON}
                  >
                    <FaPen className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${link.href} 링크 삭제`}
                    onClick={() => removeLink(link.id)}
                    className={`${ICON_BUTTON} hover:text-red-300`}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}

        {links.length === 0 && !isAdding && (
          <li className="py-10 text-center text-sm text-white/50">등록된 링크가 없습니다. 링크를 추가해 보세요.</li>
        )}
      </ul>
    </div>
  );
};

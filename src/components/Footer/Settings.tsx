import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { FaTimes, FaUndo } from "react-icons/fa";
import { DEFAULT_SETTINGS, settingsStore } from "../../hooks/useSettings";
import { navLinksStore } from "../../hooks/useNavLinks";
import { tokenStore } from "../../hooks/useTokens";
import { GeneralSection } from "../Settings/GeneralSection";
import { HelpSection } from "../Settings/HelpSection";
import { LinksSection } from "../Settings/LinksSection";
import { NewsSection } from "../Settings/NewsSection";
import { StorageSection } from "../Settings/StorageSection";

type SettingsProps = {
  onClose: () => void;
};

const TABS = [
  { id: "general", label: "일반" },
  { id: "links", label: "빠른 링크" },
  { id: "storage", label: "저장소" },
  { id: "help", label: "도움말" },
  { id: "news", label: "새 소식" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const Settings = ({ onClose }: SettingsProps) => {
  const [tab, setTab] = useState<TabId>("general");
  // 저장을 누르기 전까지는 임시 값만 수정하고, 저장 시 스토어에 반영한다
  const [settings, setSettings] = useState(settingsStore.get);
  const [tokens, setTokens] = useState(tokenStore.get);
  const [links, setLinks] = useState(navLinksStore.get);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    if (!settingsStore.set(settings)) {
      setSaveError("저장 공간이 부족해 저장하지 못했습니다. 더 작은 배경 이미지를 사용해 주세요.");
      return;
    }

    if (!tokenStore.set(tokens)) {
      setSaveError("토큰을 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    if (!navLinksStore.set(links)) {
      setSaveError("링크를 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    onClose();
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4 font-pretendard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(event) => {
        // 모달 바깥(배경)을 누르면 취소
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="설정"
        className="glass flex h-[680px] max-h-full w-[640px] max-w-full flex-col overflow-hidden bg-[#C4C4C4]/40 text-white"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* 헤더 섹션 */}
        <section className="flex shrink-0 items-center justify-between px-7 pt-6">
          <h2 className="text-2xl font-bold">설정</h2>
          <button
            type="button"
            aria-label="설정 닫기"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
          >
            <FaTimes />
          </button>
        </section>

        {/* 메뉴 섹션 */}
        <section role="tablist" className="mx-7 mt-4 flex shrink-0 gap-6 border-b border-white/15">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === tab}
              onClick={() => setTab(item.id)}
              className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm transition-colors duration-200 ${
                item.id === tab
                  ? "border-white font-semibold text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        {/* 설정 섹션 */}
        <section
          role="tabpanel"
          className="min-h-0 flex-1 overflow-y-auto px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tab === "general" && (
            <GeneralSection settings={settings} onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))} />
          )}
          {tab === "links" && <LinksSection links={links} onChange={setLinks} />}
          {tab === "storage" && <StorageSection tokens={tokens} onChange={setTokens} />}
          {tab === "help" && <HelpSection />}
          {tab === "news" && <NewsSection />}
        </section>

        {/* 저장 / 취소 섹션 */}
        <section className="shrink-0 border-t border-white/15 px-7 py-4">
          {saveError && <p className="mb-3 text-xs text-red-300">{saveError}</p>}
          <div className="flex items-center justify-between gap-3">
            {tab === "general" ? (
              <button
                type="button"
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
              >
                <FaUndo className="h-3 w-3" />
                기본값으로 초기화
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg bg-white/15 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:bg-white/25"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-400"
              >
                저장
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

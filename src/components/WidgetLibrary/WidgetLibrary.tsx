import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { addWidget, removeWidget, useAddedWidgets } from "../../hooks/useAddedWidgets";
import type { WidgetCatalogItem, WidgetOptions, WidgetType } from "../../types/widget";
import { WidgetCard } from "./WidgetCard";
import { WIDGET_CATALOG } from "../Widgets/widgetCatalog";
import { WidgetEditor } from "../WidgetEditor/WidgetEditor";

/** 편집 창에서 옵션을 정하는 중인 새 위젯 */
type Draft = { item: WidgetCatalogItem; options: WidgetOptions };

type WidgetLibraryProps = {
  onClose: () => void;
};

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "not-added", label: "추가 안 됨" },
  { id: "added", label: "추가됨" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export const WidgetLibrary = ({ onClose }: WidgetLibraryProps) => {
  const addedWidgets = useAddedWidgets();
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const isCreating = draft !== null;
  const closeDraft = useCallback(() => setDraft(null), []);

  useEffect(() => {
    // 새 위젯 편집 창이 열려 있으면 ESC는 편집 창만 닫는다
    if (isCreating) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isCreating]);

  // 위젯을 바로 추가하지 않고, 편집 창에서 옵션을 정한 뒤 추가한다 (예: 빠른 링크는 링크를 먼저 입력)
  // 편집할 항목이 없는 위젯은 바로 추가한다
  const startCreate = (item: WidgetCatalogItem) => {
    if (!item.editor) {
      addWidget(item.type, item.allowMultiple);
      return;
    }

    setDraft({ item, options: { ...item.initialOptions } });
  };

  const createError = draft?.item.validate?.(draft.options) ?? null;

  const addedCounts = new Map<WidgetType, number>();
  for (const widget of addedWidgets) addedCounts.set(widget.type, (addedCounts.get(widget.type) ?? 0) + 1);
  const keyword = query.trim().toLowerCase();
  const visibleItems = WIDGET_CATALOG.filter((item) => {
    const isAdded = addedCounts.has(item.type);

    if (filter === "added" && !isAdded) return false;
    if (filter === "not-added" && isAdded) return false;

    return !keyword || `${item.name} ${item.description}`.toLowerCase().includes(keyword);
  });

  return createPortal(
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-3 font-pretendard md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(event) => {
        // 모달 바깥(배경)을 누르면 닫기
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="위젯"
        className="glass flex h-full max-h-full w-[760px] md:h-[680px] max-w-full flex-col overflow-hidden bg-[#C4C4C4]/40 text-white"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* 헤더 섹션 */}
        <section className="flex shrink-0 flex-col gap-4 px-5 pt-5 md:px-7 md:pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold md:text-2xl">위젯</h2>
            <button
              type="button"
              aria-label="위젯 창 닫기"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 focus-within:border-white/40">
            <FaSearch className="h-3.5 w-3.5 shrink-0 text-white/50" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="위젯 검색"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </label>

          <div role="tablist" className="flex gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === filter}
                onClick={() => setFilter(item.id)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-200 ${
                  item.id === filter
                    ? "border-white bg-white/20 font-semibold text-white"
                    : "border-transparent bg-white/10 text-white/60 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* 바디 섹션 */}
        <section
          role="tabpanel"
          className="min-h-0 flex-1 overflow-y-auto border-t border-white/15 px-5 py-5 md:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {visibleItems.map((item) => (
                <WidgetCard
                  key={item.type}
                  name={item.name}
                  description={item.description}
                  icon={item.icon}
                  color={item.color}
                  background={item.background}
                  addedCount={addedCounts.get(item.type) ?? 0}
                  allowMultiple={item.allowMultiple ?? false}
                  onAdd={() => startCreate(item)}
                  onRemove={() => removeWidget(item.type)}
                />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-white/50">조건에 맞는 위젯이 없습니다.</p>
          )}
        </section>
      </motion.div>

      <AnimatePresence>
        {draft && (
          <WidgetEditor
            mode="create"
            name={draft.item.name}
            onClose={closeDraft}
            createError={createError}
            onCreate={() => {
              if (createError) return;

              addWidget(draft.item.type, draft.item.allowMultiple, draft.options);
              closeDraft();
            }}
          >
            {draft.item.editor?.({
              options: draft.options,
              // 아이콘 자동 찾기처럼 늦게 도착하는 변경도 최신 옵션에 합쳐지도록 함수형 업데이트를 쓴다
              onChange: (options) =>
                setDraft((prev) => (prev ? { ...prev, options: { ...prev.options, ...options } } : prev)),
            })}
          </WidgetEditor>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
};

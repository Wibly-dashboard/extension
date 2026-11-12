import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { FaTimes, FaTrash } from "react-icons/fa";

type WidgetEditorProps = {
  /** 편집 중인 위젯 이름 */
  name: string;
  onClose: () => void;
  /** 위젯을 대시보드에서 삭제 */
  onDelete: () => void;
};

export const WidgetEditor = ({ name, onClose, onDelete }: WidgetEditorProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); // 실수로 삭제하지 않도록 한 번 더 누르게 한다

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4 font-pretendard"
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
        aria-label={`${name} 편집`}
        className="glass flex max-h-full w-[480px] max-w-full flex-col overflow-hidden bg-neutral-900/60 text-white"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* 헤더 섹션 */}
        <section className="flex shrink-0 items-center justify-between px-7 pt-6">
          <div className="min-w-0">
            <p className="text-xs text-white/60">위젯 편집</p>
            <h2 className="truncate text-2xl font-bold">{name}</h2>
          </div>
          <button
            type="button"
            aria-label="편집 창 닫기"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
          >
            <FaTimes />
          </button>
        </section>

        {/* 편집 항목 섹션 (위젯별 편집 항목은 여기에 추가) */}
        <section className="min-h-0 flex-1 overflow-y-auto px-7 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm text-white/60">
            이 위젯에서 편집할 수 있는 항목이 아직 없습니다.
          </p>
        </section>

        {/* 삭제 / 닫기 섹션 */}
        <section className="flex shrink-0 items-center justify-end gap-2 border-t border-white/15 px-7 py-4">
          {isConfirmingDelete && <p className="mr-auto text-xs text-red-300">한 번 더 누르면 위젯이 삭제됩니다.</p>}
          <button
            type="button"
            onClick={() => (isConfirmingDelete ? onDelete() : setIsConfirmingDelete(true))}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 ${
              isConfirmingDelete
                ? "bg-red-500 font-semibold text-white hover:bg-red-400"
                : "bg-red-400/15 text-red-200 hover:bg-red-400/25"
            }`}
          >
            <FaTrash className="h-3 w-3" />
            {isConfirmingDelete ? "삭제 확인" : "위젯 삭제"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-white/15 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:bg-white/25"
          >
            닫기
          </button>
        </section>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

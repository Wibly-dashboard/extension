import type { IconType } from "react-icons";
import { FaPlus, FaTimes } from "react-icons/fa";

type WidgetCardProps = {
  name: string;
  description: string;
  icon: IconType;
  /** 아이콘 색 (Tailwind text-* 클래스) */
  color: string;
  /** 작은 아이콘 배경 색 (Tailwind bg-* 클래스) */
  background: string;
  isAdded: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

export const WidgetCard = ({
  name,
  description,
  icon: Icon,
  color,
  background,
  isAdded,
  onAdd,
  onRemove,
}: WidgetCardProps) => {
  return (
    <article className="flex flex-col rounded-xl border border-white/15 bg-white/10 p-4 transition-colors duration-200 hover:bg-white/15">
      {/* 이름 */}
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${background} ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="truncate text-base font-semibold text-white">{name}</h3>
      </div>

      {/* 미리보기 */}
      <div className="flex h-24 items-center justify-center">
        <Icon className={`h-14 w-14 ${color}`} />
      </div>

      {/* 설명 */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-white/70">{description}</p>

      {isAdded ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors duration-200 hover:bg-white/25 hover:text-white"
        >
          <FaTimes className="h-3 w-3" />
          대시보드에서 제거
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-blue-400"
        >
          <FaPlus className="h-3 w-3" />
          대시보드에 추가
        </button>
      )}
    </article>
  );
};

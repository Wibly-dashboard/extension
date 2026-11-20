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
  /** 대시보드에 추가된 이 위젯의 개수 */
  addedCount: number;
  /** true면 이미 추가돼 있어도 계속 추가할 수 있다 */
  allowMultiple: boolean;
  onAdd: () => void;
  /** 이 종류의 위젯을 대시보드에서 모두 제거한다 */
  onRemove: () => void;
};

export const WidgetCard = ({
  name,
  description,
  icon: Icon,
  color,
  background,
  addedCount,
  allowMultiple,
  onAdd,
  onRemove,
}: WidgetCardProps) => {
  const isAdded = addedCount > 0;

  return (
    <article className="flex flex-col rounded-xl border border-white/15 bg-white/10 p-4 transition-colors duration-200 hover:bg-white/15">
      {/* 이름 */}
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${background} ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="truncate text-base font-semibold text-white">{name}</h3>
        {allowMultiple && isAdded && (
          <span className="ml-auto shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/80">
            {addedCount}개 추가됨
          </span>
        )}
      </div>

      {/* 미리보기 */}
      <div className="flex h-24 items-center justify-center">
        <Icon className={`h-14 w-14 ${color}`} />
      </div>

      {/* 설명 */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-white/70">{description}</p>

      {allowMultiple ? (
        <div className="flex gap-2">
          <AddButton onClick={onAdd} className="flex-1" />
          {isAdded && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`${name} 위젯 모두 제거`}
              title="대시보드에서 모두 제거"
              className="flex cursor-pointer items-center justify-center rounded-lg bg-white/15 px-3 py-2 text-white/80 transition-colors duration-200 hover:bg-white/25 hover:text-white"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : isAdded ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white/80 transition-colors duration-200 hover:bg-white/25 hover:text-white"
        >
          <FaTimes className="h-3 w-3" />
          대시보드에서 제거
        </button>
      ) : (
        <AddButton onClick={onAdd} />
      )}
    </article>
  );
};

const AddButton = ({ onClick, className = "" }: { onClick: () => void; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-blue-400 ${className}`}
  >
    <FaPlus className="h-3 w-3" />
    대시보드에 추가
  </button>
);

import { useState } from "react";
import { MdLink } from "react-icons/md";

type FastLinkWidgetProps = {
  LinkName: string;
  /** 비어 있으면 눌러도 이동하지 않는다 */
  LinkUrl?: string;
  LinkImageUrl: string;
  isShowLinkName: boolean;
};

type FastLinkIconProps = {
  imageUrl: string;
  alt?: string;
  /** 크기·모서리 클래스 */
  className: string;
};

/** 아이콘 주소가 비었거나 불러오지 못하면 링크 아이콘으로 대체해 보여준다 */
export const FastLinkIcon = ({ imageUrl, alt = "", className }: FastLinkIconProps) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!imageUrl.trim() || failedUrl === imageUrl) {
    return (
      <span className={`flex shrink-0 items-center justify-center bg-white/15 text-white/60 ${className}`}>
        <MdLink className="h-1/2 w-1/2" />
      </span>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      draggable={false}
      onError={() => setFailedUrl(imageUrl)}
      className={`shrink-0 object-cover select-none pointer-events-none ${className}`}
    />
  );
};

export const FastLinkWidget: React.FC<FastLinkWidgetProps> = ({ LinkName, LinkUrl, LinkImageUrl, isShowLinkName }) => {
  return (
    <a
      href={LinkUrl}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false} // 브라우저 기본 링크 드래그가 시작되면 mouseup이 react-draggable에 전달되지 않아 위젯이 놓아지지 않는다
      // 이름을 숨기면 위젯 크기를 이미지 크기에 맞춘다
      className={`block ${isShowLinkName ? "w-[100px] h-[100px]" : "w-fit h-fit"}`}
    >
      <div
        className={`flex flex-col items-center justify-center gap-2 ${isShowLinkName ? "w-[100px] h-[100px]" : "w-fit h-fit"}`}
      >
        <FastLinkIcon imageUrl={LinkImageUrl} alt={LinkName} className="w-[60px] h-[60px] rounded-2xl" />
        {isShowLinkName && (
          <span className="max-w-full truncate text-center text-sm font-medium text-white">{LinkName}</span>
        )}
      </div>
    </a>
  );
};

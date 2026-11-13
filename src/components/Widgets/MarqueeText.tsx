import type { CSSProperties } from "react";

type MarqueeTextProps = {
  text: string;
  /** 이 글자 수 이상이면 흐르는 텍스트로 표시 */
  minLength: number;
  /** false면 길이와 관계없이 흐르지 않고 고정된 텍스트로 표시 (기본값 true) */
  isRunning?: boolean;
  className?: string;
};

const MS_PER_CHARACTER = 150; // 글자 수에 비례해 한 바퀴 시간을 늘려 긴 텍스트도 비슷한 속도로 흐르게 한다
const GAP_CLASS = "pr-8"; // 반복되는 텍스트 사이 간격 (각 복사본 뒤에 붙여 두 벌의 너비를 똑같이 맞춘다)

/** 텍스트가 길면 옆으로 끊김 없이 계속 흐르게, 짧으면 그대로 보여준다 */
export const MarqueeText = ({ text, minLength, isRunning = true, className = "" }: MarqueeTextProps) => {
  if (!isRunning || text.length < minLength) {
    return <span className={`block truncate ${className}`}>{text}</span>;
  }

  const style = { "--marquee-duration": `${text.length * MS_PER_CHARACTER}ms` } as CSSProperties;

  return (
    <span className={`block overflow-hidden ${className}`} aria-label={text}>
      {/* 곡이 바뀌면 처음 위치부터 다시 흐르도록 key로 새로 만든다 */}
      <span key={text} className="flex w-max animate-marquee whitespace-nowrap" style={style} aria-hidden>
        <span className={GAP_CLASS}>{text}</span>
        <span className={GAP_CLASS}>{text}</span>
      </span>
    </span>
  );
};

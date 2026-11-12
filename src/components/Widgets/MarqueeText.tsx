import type { CSSProperties } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

type MarqueeTextProps = {
  text: string;
  /** 이 글자 수 이상이면 흐르는 텍스트로 표시 */
  minLength: number;
  /** false면 길이와 관계없이 흐르지 않고 고정된 텍스트로 표시 (기본값 true) */
  isRunning?: boolean;
  className?: string;
};

const COPY_COUNT = 3; // loop 모드는 화면을 채울 만큼 슬라이드가 있어야 하므로 같은 텍스트를 여러 번 둔다
const MS_PER_CHARACTER = 150; // 글자 수에 비례해 한 바퀴 시간을 늘려 긴 텍스트도 비슷한 속도로 흐르게 한다
const GAP_PX = 32; // 반복되는 텍스트 사이 간격

// 슬라이드 사이 이동을 일정한 속도로 (기본값은 가속/감속이 있어 멈칫거림)
const linearStyle = { "--swiper-wrapper-transition-timing-function": "linear" } as CSSProperties;

/** 텍스트가 길면 Swiper로 옆으로 계속 흐르게, 짧으면 그대로 보여준다 */
export const MarqueeText = ({ text, minLength, isRunning = true, className = "" }: MarqueeTextProps) => {
  if (!isRunning || text.length < minLength) {
    return <span className={`block truncate ${className}`}>{text}</span>;
  }

  return (
    <Swiper
      // 곡이 바뀌면 처음 위치부터 다시 흐르도록 새로 만든다
      key={text}
      modules={[Autoplay]}
      loop
      slidesPerView="auto"
      spaceBetween={GAP_PX}
      speed={text.length * MS_PER_CHARACTER}
      autoplay={{ delay: 0, disableOnInteraction: false }}
      // 위젯 드래그와 충돌하지 않도록 마우스로 넘기는 동작은 끈다
      allowTouchMove={false}
      style={linearStyle}
      className={`w-full ${className}`}
    >
      {Array.from({ length: COPY_COUNT }, (_, index) => (
        // swiper.css(레이어 밖)가 width: 100%를 지정하므로 important로 내용 너비에 맞춘다
        <SwiperSlide key={index} className="!w-auto whitespace-nowrap" aria-hidden={index > 0}>
          {text}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

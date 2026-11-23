import { useSyncExternalStore } from "react";
import { getWidgetScale } from "../components/Body/scale";

// 창 크기뿐 아니라 기기 픽셀 비율(OS 배율, 다른 모니터로 창 이동)이 바뀌어도 다시 계산한다
const subscribe = (listener: () => void) => {
  let resolutionQuery: MediaQueryList | null = null;

  // 픽셀 비율은 "현재 값과 같은지"로만 감시할 수 있어서, 바뀔 때마다 새 값으로 다시 등록한다
  const watchResolution = () => {
    resolutionQuery?.removeEventListener("change", handleResolutionChange);
    resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    resolutionQuery.addEventListener("change", handleResolutionChange);
  };

  function handleResolutionChange() {
    watchResolution();
    listener();
  }

  watchResolution();
  window.addEventListener("resize", listener);

  return () => {
    window.removeEventListener("resize", listener);
    resolutionQuery?.removeEventListener("change", handleResolutionChange);
  };
};

const getSnapshot = () =>
  getWidgetScale({ width: window.innerWidth, height: window.innerHeight }, window.devicePixelRatio);

/** 현재 브라우저 창 크기에 맞는 위젯 배율 (scale.ts 참고) */
export const useWidgetScale = () => useSyncExternalStore(subscribe, getSnapshot);

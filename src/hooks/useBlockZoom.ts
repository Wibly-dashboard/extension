import { useEffect } from "react";

const ZOOM_KEYS = new Set(["+", "-", "=", "0"]);
const ZOOM_CODES = new Set(["NumpadAdd", "NumpadSubtract", "Numpad0"]);

// 브라우저 확대/축소(Ctrl + 휠, Ctrl + +/-/0)를 막아 위젯 크기가 항상 같게 보이도록 함
export const useBlockZoom = () => {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      if (ZOOM_KEYS.has(event.key) || ZOOM_CODES.has(event.code)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
};

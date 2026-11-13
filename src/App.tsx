import { type CSSProperties } from "react";
import { BodySection } from "./components/Body/BodySection";
import { BottomNavigator } from "./components/Footer/BottomNavigator";
import { useBlockZoom } from "./hooks/useBlockZoom";
import { DEFAULT_BACKGROUND_URL, useSettings } from "./hooks/useSettings";

export const App = () => {
  useBlockZoom();
  const { background, fontColor } = useSettings();

  // 사용자가 고른 값은 CSS 변수로 넘기고, 실제 스타일은 Tailwind 클래스에서 변수를 참조한다
  const themeVariables = {
    "--dashboard-font-color": fontColor,
    "--dashboard-bg-color": background.type === "color" ? background.value : "transparent",
    "--dashboard-bg-image":
      background.type === "color"
        ? "none"
        : `url("${background.type === "image" ? background.value : DEFAULT_BACKGROUND_URL}")`,
  } as CSSProperties;

  return (
    <main
      style={themeVariables}
      className="relative flex min-h-screen flex-col items-center gap-5 bg-(--dashboard-bg-color) bg-(image:--dashboard-bg-image) bg-cover bg-center bg-no-repeat px-4 pt-5 pb-5 text-(--dashboard-font-color) select-none"
    >
      <BodySection />
      <BottomNavigator />
    </main>
  );
};

export default App;

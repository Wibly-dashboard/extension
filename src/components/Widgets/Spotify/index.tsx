import { FaSpotify } from "react-icons/fa";
import type { WidgetCatalogItem } from "../../../types/widget";
import { OptionSelector } from "../../WidgetEditor/OptionSelector";
import { SpotifyWidget } from "./SpotifyWidget";
import { BACKGROUND_STYLE_LABELS, BACKGROUND_STYLES, parseBackgroundStyle } from "./spotifyOptions";

export const spotifyWidget: WidgetCatalogItem = {
  type: "spotify",
  name: "Spotify",
  description: "지금 재생 중인 곡과 재생 컨트롤을 보여줍니다.",
  icon: FaSpotify,
  color: "text-green-200",
  background: "bg-green-400/20",
  render: (options) => <SpotifyWidget backgroundStyle={parseBackgroundStyle(options.backgroundStyle)} />,
  editor: ({ options, onChange }) => (
    <OptionSelector
      label="배경 스타일"
      options={BACKGROUND_STYLES}
      optionLabels={BACKGROUND_STYLE_LABELS}
      value={parseBackgroundStyle(options.backgroundStyle)}
      onChange={(backgroundStyle) => onChange({ backgroundStyle })}
    />
  ),
};

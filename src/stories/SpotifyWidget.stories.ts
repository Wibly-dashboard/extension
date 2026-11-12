import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpotifyPlayerView } from "../components/Widgets/SpotifyWidget";

// 실제 위젯(SpotifyWidget)은 토큰으로 API를 호출하므로, 스토리에서는 화면만 그리는 SpotifyPlayerView를 사용한다
const meta: Meta<typeof SpotifyPlayerView> = {
  title: "Widgets/SpotifyWidget",
  tags: ["autodocs"],
  component: SpotifyPlayerView,
};

export default meta;
type Story = StoryObj<typeof SpotifyPlayerView>;

export const Default: Story = {
  args: {
    albumCoverUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL2JHMmJrHtM03_BlEtYokUjk96e3bP5NwsyIfzZEgfrgdIEo07m4c8c&s=10",
    trackTitle: "Touch The Sky",
    artistName: "Kanye West",
    progressMs: 83000,
    durationMs: 237000,
    isPlaying: true,
    shuffle: false,
    repeat: "off",
    backgroundStyle: "glass",
  },
};

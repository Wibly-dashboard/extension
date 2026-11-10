import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpotifyWidget } from "../components/Widgets/SpotifyWidget";

const meta: Meta<typeof SpotifyWidget> = {
  title: "Widgets/SpotifyWidget",
  tags: ["autodocs"],
  component: SpotifyWidget,
};

export default meta;
type Story = StoryObj<typeof SpotifyWidget>;

export const Default: Story = {
  args: {
    albumCoverUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL2JHMmJrHtM03_BlEtYokUjk96e3bP5NwsyIfzZEgfrgdIEo07m4c8c&s=10",
    trackTitle: "Touch The Sky",
    artistName: "Kanye West",
    currentTime: "0:00",
    totalTime: "3:57",
    progressPercentage: 35,
    backgroundStyle: "glass",
  },
};

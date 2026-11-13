import type { Meta, StoryObj } from "@storybook/react-vite";
import { createElement } from "react";
import { SpotifyMessage, SpotifyPlayerView } from "../components/Widgets/SpotifyWidget";

// 실제 위젯(SpotifyWidget)은 토큰으로 API를 호출하므로, 스토리에서는 화면만 그리는 SpotifyPlayerView / SpotifyMessage를 사용한다
const meta: Meta<typeof SpotifyPlayerView> = {
  title: "Widgets/SpotifyWidget",
  tags: ["autodocs"],
  component: SpotifyPlayerView,
  args: {
    albumCoverUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL2JHMmJrHtM03_BlEtYokUjk96e3bP5NwsyIfzZEgfrgdIEo07m4c8c&s=10",
    trackTitle: "Touch The Sky",
    artistName: "Kanye West",
    progressMs: 0,
    durationMs: 237000,
    isPlaying: false,
    shuffle: false,
    repeat: "off",
    backgroundStyle: "glass",
    errorMessage: null,
    tokenWarning: null,
  },
  argTypes: {
    repeat: { control: "inline-radio", options: ["off", "context", "track"] },
    backgroundStyle: { control: "inline-radio", options: ["glass", "ghost", "solid"] },
  },
};

export default meta;
type Story = StoryObj<typeof SpotifyPlayerView>;

/** 재생 정보를 보여줄 수 없을 때 위젯 대신 표시되는 안내 화면 */
const message = (title: string, description: string): Story => ({
  render: ({ backgroundStyle }) => createElement(SpotifyMessage, { title, description, backgroundStyle }),
});

// ---------- 재생 화면 ----------

/** Spotify 앱에서 아무 곡도 재생하지 않을 때 (API 204) */
export const NotListening = message("재생 중인 기기가 없습니다", "Spotify 앱에서 곡을 재생하면 여기에 표시됩니다");

export const Listening: Story = {
  args: { progressMs: 83000, isPlaying: true },
};

export const ShuffleAndRepeat: Story = {
  args: { progressMs: 83000, isPlaying: true, shuffle: true, repeat: "track" },
};

/** 18글자 이상이면 제목/가수가 옆으로 흐른다 */
export const LongTitle: Story = {
  args: {
    trackTitle: "Through the Fire and Flames (Remastered 2024)",
    artistName: "DragonForce, Herman Li, Sam Totman",
    progressMs: 83000,
    isPlaying: true,
  },
};

/** 재생 제어 실패 시 아티스트 자리에 안내가 대신 표시된다 */
export const ControlError: Story = {
  args: { progressMs: 83000, isPlaying: true, errorMessage: "Spotify Premium이 필요합니다" },
};

/** Refresh Token 기한이 14일 이하로 남으면 로고 옆에 점이 표시된다 (마우스를 올리면 안내) */
export const TokenExpiring: Story = {
  args: {
    progressMs: 83000,
    isPlaying: true,
    tokenWarning: "Refresh Token 기한이 7일 남았습니다. 새 토큰을 등록해 주세요.",
  },
};

export const TokenExpired: Story = {
  args: {
    progressMs: 83000,
    isPlaying: true,
    tokenWarning: "Refresh Token 등록 후 6개월이 지났습니다. 새 토큰을 등록해 주세요.",
  },
};

// ---------- 안내 화면 (연결/토큰 오류) ----------

export const NoToken = message("Spotify 연결이 필요합니다", "설정 > 저장소 > Spotify에서 Refresh Token을 등록해 주세요");

export const InvalidRefreshToken = message(
  "Refresh Token이 올바르지 않습니다",
  "설정 > 저장소 > Spotify에서 새 Refresh Token을 등록해 주세요",
);

export const RefreshTokenExpired = message(
  "Refresh Token이 만료되었습니다 (등록 후 6개월)",
  "설정 > 저장소 > Spotify에서 새 Refresh Token을 등록해 주세요",
);

export const InvalidClient = message(
  "Client ID 또는 Client Secret이 올바르지 않습니다",
  "설정 > 저장소 > Spotify에서 입력값을 확인해 주세요",
);

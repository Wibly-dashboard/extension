import { useEffect, useState } from "react";

const PLAYER_API = "https://api.spotify.com/v1/me/player";
const POLL_INTERVAL_MS = 5000; // 재생 정보를 다시 불러오는 주기
const REFRESH_AFTER_CONTROL_MS = 400; // 제어 요청 후 Spotify에 반영될 때까지 잠시 기다렸다가 다시 불러온다

export type RepeatState = "off" | "context" | "track";

export type SpotifyTrack = {
  title: string;
  artists: string;
  albumCoverUrl: string;
  durationMs: number;
};

export type SpotifyPlayback =
  | { status: "no-token" } // 저장소에 토큰 없음
  | { status: "loading" }
  | { status: "unauthorized" } // 토큰 만료 또는 잘못된 토큰 (401)
  | { status: "forbidden" } // scope 부족 또는 개발 모드 사용자 미등록 (403)
  | { status: "error" }
  | { status: "inactive" } // 재생 중인 기기 없음 (204)
  | {
      status: "active";
      track: SpotifyTrack | null; // 광고 등 곡 정보가 없는 경우 null
      isPlaying: boolean;
      progressMs: number; // fetchedAt 시점의 재생 위치
      fetchedAt: number;
      shuffle: boolean;
      repeat: RepeatState;
    };

// GET /me/player 응답 중 사용하는 필드만 정의
type PlayerResponse = {
  is_playing: boolean;
  progress_ms: number | null;
  shuffle_state: boolean;
  repeat_state: RepeatState;
  item: {
    name: string;
    duration_ms: number;
    artists?: { name: string }[]; // 곡
    album?: { images: { url: string }[] }; // 곡
    show?: { name: string }; // 팟캐스트 에피소드
    images?: { url: string }[]; // 팟캐스트 에피소드
  } | null;
};

const toTrack = (item: NonNullable<PlayerResponse["item"]>): SpotifyTrack => ({
  title: item.name,
  artists: item.artists?.map((artist) => artist.name).join(", ") ?? item.show?.name ?? "",
  albumCoverUrl: item.album?.images[0]?.url ?? item.images?.[0]?.url ?? "",
  durationMs: item.duration_ms,
});

const fetchPlayback = async (token: string): Promise<SpotifyPlayback> => {
  const response = await fetch(PLAYER_API, { headers: { Authorization: `Bearer ${token}` } });

  if (response.status === 204) return { status: "inactive" };
  if (response.status === 401) return { status: "unauthorized" };
  if (response.status === 403) return { status: "forbidden" };
  if (!response.ok) return { status: "error" };

  const data = (await response.json()) as PlayerResponse;

  return {
    status: "active",
    track: data.item ? toTrack(data.item) : null,
    isPlaying: data.is_playing,
    progressMs: data.progress_ms ?? 0,
    fetchedAt: Date.now(),
    shuffle: data.shuffle_state,
    repeat: data.repeat_state,
  };
};

const NEXT_REPEAT: Record<RepeatState, RepeatState> = { off: "context", context: "track", track: "off" };

/**
 * Spotify 재생 정보를 주기적으로 불러오고 재생 제어 함수를 제공한다.
 * 토큰은 설정 > 저장소에서 입력한 사용자 액세스 토큰을 사용한다.
 */
export const useSpotifyPlayback = (token: string | undefined) => {
  const [playback, setPlayback] = useState<SpotifyPlayback>({ status: "loading" });
  const [controlError, setControlError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 값이 바뀌면 즉시 다시 불러온다
  const [now, setNow] = useState(Date.now); // 진행 바를 1초마다 갱신하기 위한 현재 시각

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchPlayback(token);
        if (cancelled) return;

        setPlayback(next);

        // 토큰 문제는 다시 요청해도 해결되지 않으므로 새 토큰이 저장될 때까지 반복 요청을 멈춘다
        if (next.status === "unauthorized" || next.status === "forbidden") {
          window.clearInterval(timer);
          console.warn(
            next.status === "unauthorized"
              ? "[Spotify] 401: 토큰이 만료되었거나 올바르지 않습니다. 설정 > 저장소에서 새 액세스 토큰을 저장해 주세요."
              : "[Spotify] 403: 권한이 없습니다. 토큰 scope와 Dashboard의 User Management 등록을 확인해 주세요.",
          );
        }
      } catch (error) {
        if (cancelled) return;

        // 네트워크 오류 / CORS 차단 등 응답 자체를 받지 못한 경우
        console.warn("[Spotify] 요청 실패:", error);
        setPlayback({ status: "error" });
      }
    };

    // load 안에서 timer를 참조하므로 타이머를 먼저 만든 뒤 첫 요청을 보낸다
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    void load();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, refreshKey]);

  const isPlaying = playback.status === "active" && playback.isPlaying;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const control = async (method: "PUT" | "POST", path: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${PLAYER_API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) setPlayback({ status: "unauthorized" });
      else if (response.status === 403) setControlError("재생 제어는 Spotify Premium 계정에서만 가능합니다.");
      else if (response.status === 404)
        setControlError("재생 중인 기기가 없습니다. Spotify 앱에서 먼저 재생해 주세요.");
      else setControlError(null);
    } catch {
      setControlError("Spotify에 연결하지 못했습니다.");
    }

    window.setTimeout(() => setRefreshKey((key) => key + 1), REFRESH_AFTER_CONTROL_MS);
  };

  const active = playback.status === "active" ? playback : null;
  // 마지막으로 불러온 위치에서 흐른 시간만큼 진행 (다음 응답이 오기 전까지 진행 바가 멈추지 않도록)
  const progressMs = active
    ? Math.min(
        active.track?.durationMs ?? 0,
        active.progressMs + (active.isPlaying ? Math.max(0, now - active.fetchedAt) : 0),
      )
    : 0;

  return {
    playback: token ? playback : ({ status: "no-token" } as const),
    progressMs,
    controlError,
    togglePlay: () => {
      if (!active) return;

      // 버튼 반응이 늦어 보이지 않도록 화면은 먼저 바꾼다
      setPlayback({ ...active, isPlaying: !active.isPlaying, progressMs, fetchedAt: Date.now() });
      void control("PUT", active.isPlaying ? "/pause" : "/play");
    },
    next: () => void control("POST", "/next"),
    previous: () => void control("POST", "/previous"),
    toggleShuffle: () => active && void control("PUT", `/shuffle?state=${!active.shuffle}`),
    cycleRepeat: () => active && void control("PUT", `/repeat?state=${NEXT_REPEAT[active.repeat]}`),
  };
};

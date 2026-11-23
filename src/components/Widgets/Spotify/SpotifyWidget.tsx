import { FaPause, FaPlay, FaRandom, FaSpotify, FaStepBackward, FaStepForward } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { useSpotifyPlayback, type RepeatState } from "../../../hooks/useSpotifyPlayback";
import { getRefreshTokenLifetime, type SpotifyAuthError } from "../../../hooks/spotifyAuth";
import { useAlbumColor } from "../../../hooks/useAlbumColor";
import { MarqueeText } from "./MarqueeText";
import spotifyCardBackground from "../../../assets/imgs/spotify-card-background.png";
import type { BackgroundStyle } from "./spotifyOptions";

const backgroudStyles: Record<BackgroundStyle, string> = {
  glass: "bg-white/[0.15] backdrop-blur-[12px] backdrop-saturate-[120%] group-text-white",
  // 배경 없이 내용만 표시
  ghost: "bg-transparent",
  // material은 배경 이미지(+앨범 색상 오버레이)를 MaterialBackground로 깐다
  material: "",
};

/**
 * material 스타일 배경: 카드 배경 이미지 위에 앨범 색상을 40% 불투명도로 덮는다 (내용 뒤에 깔리도록 -z-10)
 * 곡이 바뀌어 색이 달라지면 background-color 트랜지션으로 부드럽게 바뀌고, 처음 색이 잡힐 때는 페이드인한다
 */
const MaterialBackground = ({ overlayColor }: { overlayColor?: string }) => (
  <>
    <img
      src={spotifyCardBackground}
      alt=""
      aria-hidden
      draggable={false}
      // 이미지(350x170)와 위젯(464x80) 비율이 달라서 object-cover면 가운데 회색 부분만 잘려 보인다.
      // 원본 카드처럼 그라데이션 전체(어두운 모서리 포함)가 보이도록 늘려서 채운다
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-fill"
    />
    {/* 색이 없을 때도 요소를 남겨 둬야 처음 색이 들어올 때 트랜지션이 동작한다 */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 transition-[background-color,opacity] duration-700 ease-in-out"
      // tailwind에서 동적 색/opacity를 적용할 수 없어서 style로 적용
      style={{ backgroundColor: overlayColor ?? "transparent", opacity: overlayColor ? 0.4 : 0 }}
    />
  </>
);

// 제목/가수가 이 글자 수 이상이면 옆으로 흐르며 반복 표시 (17글자까지는 고정, 18글자부터 흐름)
const MARQUEE_MIN_LENGTH = 18;

const CONTROL_BUTTON = "cursor-pointer transition-colors hover:text-white";

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);

  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
};

type SpotifyMessageProps = {
  title: string;
  description: string;
  backgroundStyle: BackgroundStyle;
};

/** 연결 필요, 토큰 만료 등 재생 정보를 보여줄 수 없을 때의 안내 */
export const SpotifyMessage = ({ title, description, backgroundStyle }: SpotifyMessageProps) => (
  <div
    className={`relative isolate flex h-[80px] w-[464px] items-center gap-3 overflow-hidden rounded-2xl ${backgroudStyles[backgroundStyle]} px-4 font-pretendard`}
  >
    {backgroundStyle === "material" && <MaterialBackground />}
    <FaSpotify className="shrink-0 text-3xl text-[#1DB954]" />
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="truncate text-xs text-[#b3b3b3]">{description}</span>
    </div>
  </div>
);

export type SpotifyPlayerViewProps = {
  albumCoverUrl: string;
  trackTitle: string;
  artistName: string;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatState;
  backgroundStyle: BackgroundStyle;
  /** 앨범 커버 색상. material 스타일일 때 배경 이미지 위에 40% 불투명도로 덮인다 (SpotifyWidget에서 커버로부터 추출) */
  albumCoverColor?: string;
  /** 재생 제어 실패 시 아티스트 자리에 대신 보여줄 안내 */
  errorMessage?: string | null;
  /** 리프레시 토큰 기한 안내. 로고 옆 점과 툴팁으로 표시 */
  tokenWarning?: string | null;
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
};

/** 재생 정보를 그리기만 하는 화면 (Storybook에서도 사용) */
export const SpotifyPlayerView = ({
  albumCoverUrl,
  trackTitle,
  artistName,
  progressMs,
  durationMs,
  isPlaying,
  shuffle,
  repeat,
  backgroundStyle,
  albumCoverColor,
  errorMessage,
  tokenWarning,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
}: SpotifyPlayerViewProps) => {
  const progressPercentage = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;
  const overlayColor = albumCoverColor;

  return (
    <div
      className={`relative isolate flex h-[80px] w-[464px] items-center gap-3 overflow-hidden rounded-2xl ${backgroudStyles[backgroundStyle]} px-3 text-black font-pretendard`}
    >
      {backgroundStyle === "material" && <MaterialBackground overlayColor={overlayColor} />}
      {/* Album Cover */}
      {albumCoverUrl ? (
        <img
          src={albumCoverUrl}
          alt={`${trackTitle} 앨범 커버`}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-14 w-14 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#282828]">
          <FaSpotify className="text-xl text-[#b3b3b3]" />
        </div>
      )}

      {/* Track Information */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <MarqueeText
          text={trackTitle}
          minLength={MARQUEE_MIN_LENGTH}
          // 일시정지 상태에서는 흐르지 않고 원래(고정) 모양으로 표시
          isRunning={isPlaying}
          className="text-sm font-semibold text-white"
        />
        {errorMessage ? (
          <span className="truncate text-xs text-red-300">{errorMessage}</span>
        ) : (
          <MarqueeText
            text={artistName}
            minLength={MARQUEE_MIN_LENGTH}
            isRunning={isPlaying}
            className="text-xs text-[#b3b3b3]"
          />
        )}
      </div>

      {/* Player Controls */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button
            type="button"
            aria-label="셔플"
            aria-pressed={shuffle}
            onClick={onToggleShuffle}
            className={`${CONTROL_BUTTON} ${shuffle ? "text-[#1DB954]" : ""}`}
          >
            <FaRandom className="text-xs" />
          </button>
          <button type="button" aria-label="이전 곡" onClick={onPrevious} className={CONTROL_BUTTON}>
            <FaStepBackward className="text-sm" />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "일시정지" : "재생"}
            onClick={onTogglePlay}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
          >
            {isPlaying ? <FaPause className="text-xs" /> : <FaPlay className="ml-0.5 text-xs" />}
          </button>
          <button type="button" aria-label="다음 곡" onClick={onNext} className={CONTROL_BUTTON}>
            <FaStepForward className="text-sm" />
          </button>
          <button
            type="button"
            aria-label={`반복: ${repeat === "off" ? "끔" : repeat === "context" ? "전체" : "한 곡"}`}
            onClick={onCycleRepeat}
            className={`${CONTROL_BUTTON} relative ${repeat !== "off" ? "text-[#1DB954]" : ""}`}
          >
            <FaRepeat className="text-xs" />
            {repeat === "track" && <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold">1</span>}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex w-[190px] items-center gap-2 text-[10px] text-[#b3b3b3]">
          <span className="w-7 text-right tabular-nums">{formatTime(progressMs)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#4d4d4d]">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${progressPercentage}%` }} />
          </div>
          <span className="w-7 tabular-nums">{formatTime(durationMs)}</span>
        </div>
      </div>

      {/* Spotify Logo */}
      <div className="relative ml-1 flex h-full shrink-0 items-center" title={tokenWarning ?? undefined}>
        <FaSpotify className="text-xl text-[#1DB954]" />
        {tokenWarning && (
          <span
            role="status"
            aria-label={tokenWarning}
            className="absolute top-5 -right-1 h-2.5 w-2.5 rounded-full border border-black/40 bg-amber-400"
          />
        )}
      </div>
    </div>
  );
};

type SpotifyWidgetProps = {
  backgroundStyle: BackgroundStyle;
};

const AUTH_ERROR_MESSAGES: Record<SpotifyAuthError, { title: string; description: string }> = {
  "invalid-refresh-token": {
    title: "Refresh Token이 올바르지 않습니다",
    description: "설정 > 저장소 > Spotify에서 새 Refresh Token을 등록해 주세요",
  },
  "invalid-client": {
    title: "Client ID 또는 Client Secret이 올바르지 않습니다",
    description: "설정 > 저장소 > Spotify에서 입력값을 확인해 주세요",
  },
  network: { title: "Spotify에 연결하지 못했습니다", description: "잠시 후 다시 시도합니다" },
  unknown: {
    title: "토큰을 발급하지 못했습니다",
    description: "설정 > 저장소 > Spotify에서 토큰을 다시 등록해 주세요",
  },
};

/** 리프레시 토큰 기한(등록 후 6개월)이 가까워지거나 지났을 때 보여줄 안내 */
const getTokenWarning = (registeredAt: string | undefined) => {
  if (!registeredAt) return null;

  const { status, daysLeft } = getRefreshTokenLifetime(registeredAt);
  if (status === "expired") return "Refresh Token 등록 후 6개월이 지났습니다. 새 토큰을 등록해 주세요.";
  if (status === "expiring") return `Refresh Token 기한이 ${daysLeft}일 남았습니다. 새 토큰을 등록해 주세요.`;

  return null;
};

/** 설정 > 저장소 > Spotify의 리프레시 토큰으로 현재 재생 정보를 불러와 보여주는 위젯 */
export const SpotifyWidget = ({ backgroundStyle }: SpotifyWidgetProps) => {
  const { playback, progressMs, controlError, registeredAt, ...controls } = useSpotifyPlayback();
  // material 스타일일 때만 커버 색을 추출한다 (훅은 조건부로 부를 수 없어서 url을 넘기지 않는 방식으로 끈다)
  const albumCoverUrl = playback.status === "active" ? playback.track?.albumCoverUrl : undefined;
  const albumCoverColor = useAlbumColor(backgroundStyle === "material" ? albumCoverUrl : undefined);

  switch (playback.status) {
    case "no-token":
      return (
        <SpotifyMessage
          title="Spotify 연결이 필요합니다"
          description="설정 > 저장소 > Spotify에서 Refresh Token을 등록해 주세요"
          backgroundStyle={backgroundStyle}
        />
      );
    case "loading":
      return (
        <SpotifyMessage
          title="불러오는 중..."
          description="Spotify 재생 정보를 확인하고 있습니다"
          backgroundStyle={backgroundStyle}
        />
      );
    case "auth-error": {
      // 기한이 지난 토큰이 거부됐다면 '잘못된 토큰'이 아니라 '기한 만료'로 안내한다
      const expired =
        playback.reason === "invalid-refresh-token" &&
        getRefreshTokenLifetime(playback.registeredAt).status === "expired";
      const message = expired
        ? {
            title: "Refresh Token이 만료되었습니다 (등록 후 6개월)",
            description: "설정 > 저장소 > Spotify에서 새 Refresh Token을 등록해 주세요",
          }
        : AUTH_ERROR_MESSAGES[playback.reason];

      return <SpotifyMessage {...message} backgroundStyle={backgroundStyle} />;
    }
    case "unauthorized":
      return (
        <SpotifyMessage
          title="Spotify 인증에 실패했습니다"
          description="설정 > 저장소 > Spotify에서 토큰을 다시 등록해 주세요"
          backgroundStyle={backgroundStyle}
        />
      );
    case "forbidden":
      return (
        <SpotifyMessage
          title="접근 권한이 없습니다"
          description="토큰 scope와 Dashboard의 User Management 등록을 확인해 주세요"
          backgroundStyle={backgroundStyle}
        />
      );
    case "error":
      return (
        <SpotifyMessage
          title="Spotify에 연결하지 못했습니다"
          description="잠시 후 다시 시도합니다"
          backgroundStyle={backgroundStyle}
        />
      );
    case "inactive":
      return (
        <SpotifyMessage
          title="재생 중인 기기가 없습니다"
          description="Spotify 앱에서 곡을 재생하면 여기에 표시됩니다"
          backgroundStyle={backgroundStyle}
        />
      );
    case "active":
      return (
        <SpotifyPlayerView
          albumCoverUrl={playback.track?.albumCoverUrl ?? ""}
          trackTitle={playback.track?.title ?? "알 수 없는 항목"}
          artistName={playback.track?.artists ?? ""}
          progressMs={progressMs}
          durationMs={playback.track?.durationMs ?? 0}
          isPlaying={playback.isPlaying}
          shuffle={playback.shuffle}
          repeat={playback.repeat}
          backgroundStyle={backgroundStyle}
          albumCoverColor={albumCoverColor}
          errorMessage={controlError}
          tokenWarning={getTokenWarning(registeredAt)}
          onTogglePlay={controls.togglePlay}
          onNext={controls.next}
          onPrevious={controls.previous}
          onToggleShuffle={controls.toggleShuffle}
          onCycleRepeat={controls.cycleRepeat}
        />
      );
  }
};

import { FaPause, FaPlay, FaRandom, FaSpotify, FaStepBackward, FaStepForward } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { useSpotifyPlayback, type RepeatState } from "../../hooks/useSpotifyPlayback";
import { useServiceToken } from "../../hooks/useTokens";
import { MarqueeText } from "./MarqueeText";

type BackgroundStyle = "glass" | "ghost" | "solid";

const backgroudStyles: Record<BackgroundStyle, string> = {
  glass: "bg-white/[0.15] backdrop-blur-[12px] backdrop-saturate-[120%] group-text-white",
  ghost: "bg-[#fefefe]/[100]",
  solid: "bg-[#fefefe]",
};

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
const SpotifyMessage = ({ title, description, backgroundStyle }: SpotifyMessageProps) => (
  <div
    className={`flex h-[80px] w-[464px] items-center gap-3 rounded-xl ${backgroudStyles[backgroundStyle]} px-4 font-pretendard`}
  >
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
  /** 재생 제어 실패 시 아티스트 자리에 대신 보여줄 안내 */
  errorMessage?: string | null;
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
  errorMessage,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
}: SpotifyPlayerViewProps) => {
  const progressPercentage = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

  return (
    <div
      className={`flex h-[80px] w-[464px] items-center gap-3 rounded-xl ${backgroudStyles[backgroundStyle]} px-3 text-black font-pretendard`}
    >
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
      <div className="ml-1 flex h-full shrink-0 items-center">
        <FaSpotify className="text-xl text-[#1DB954]" />
      </div>
    </div>
  );
};

type SpotifyWidgetProps = {
  backgroundStyle: BackgroundStyle;
};

/** 설정 > 저장소의 Spotify 토큰으로 현재 재생 정보를 불러와 보여주는 위젯 */
export const SpotifyWidget = ({ backgroundStyle }: SpotifyWidgetProps) => {
  const token = useServiceToken("spotify");
  const { playback, progressMs, controlError, ...controls } = useSpotifyPlayback(token);

  switch (playback.status) {
    case "no-token":
      return (
        <SpotifyMessage
          title="Spotify 연결이 필요합니다"
          description="설정 > 저장소에서 토큰을 등록해 주세요"
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
    case "unauthorized":
      return (
        <SpotifyMessage
          title="토큰이 만료되었거나 올바르지 않습니다"
          description="설정 > 저장소에서 새 액세스 토큰을 입력해 주세요"
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
          errorMessage={controlError}
          onTogglePlay={controls.togglePlay}
          onNext={controls.next}
          onPrevious={controls.previous}
          onToggleShuffle={controls.toggleShuffle}
          onCycleRepeat={controls.cycleRepeat}
        />
      );
  }
};

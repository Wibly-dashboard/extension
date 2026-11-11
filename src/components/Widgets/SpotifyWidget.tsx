import {
  FaSpotify,
  FaPlay,
  FaStepBackward,
  FaStepForward,
  FaRandom,
} from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { useServiceToken } from "../../hooks/useTokens";

type SpotifyWidgetProps = {
  albumCoverUrl: string;
  trackTitle: string;
  artistName: string;
  currentTime: string;
  totalTime: string;
  progressPercentage: number;
  backgroundStyle: "glass" | "ghost" | "solid";
};

const backgroudStyles = {
  glass:
    "bg-white/[0.15] backdrop-blur-[12px] backdrop-saturate-[120%] group-text-white",
  ghost: "bg-[#fefefe]/[100]",
  solid: "bg-[#fefefe]",
};

export const SpotifyWidget = ({
  albumCoverUrl,
  trackTitle,
  artistName,
  currentTime,
  totalTime,
  backgroundStyle,
}: SpotifyWidgetProps) => {
  // 설정 > 저장소에 있는 토큰을 읽어 동작한다. 토큰이 없으면 연결 안내를 보여준다
  // TODO: 실제 Spotify API 연동 시 이 토큰으로 재생 정보를 요청
  const token = useServiceToken("spotify");

  if (!token) {
    return (
      <div
        className={`flex h-[80px] w-[464px] items-center gap-3 rounded-xl ${backgroudStyles[backgroundStyle]} px-4 font-pretendard`}
      >
        <FaSpotify className="shrink-0 text-3xl text-[#1DB954]" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">Spotify 연결이 필요합니다</span>
          <span className="text-xs text-[#b3b3b3]">설정 &gt; 저장소에서 토큰을 등록해 주세요</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-[80px] w-[464px] items-center gap-3 rounded-xl ${backgroudStyles[backgroundStyle]} px-3 text-black font-pretendard`}
    >
      {/* Album Cover */}
      <img
        src={albumCoverUrl}
        alt="Touch The Sky Album Cover"
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-md object-cover"
      />

      {/* Track Information */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="truncate text-sm font-semibold text-white">
          {trackTitle}
        </span>
        <span className="truncate text-xs text-[#b3b3b3]">{artistName}</span>
      </div>

      {/* Player Controls */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <FaRandom className="cursor-pointer text-xs hover:text-white" />
          <FaStepBackward className="cursor-pointer text-sm hover:text-white" />
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105">
            <FaPlay className="ml-0.5 text-xs" />
          </button>
          <FaStepForward className="cursor-pointer text-sm hover:text-white" />
          <FaRepeat className="cursor-pointer text-xs hover:text-white" />
        </div>

        {/* Progress Bar */}
        <div className="flex w-[190px] items-center gap-2 text-[10px] text-[#b3b3b3]">
          <span>{currentTime}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#4d4d4d]">
            <div className="h-full w-[35%] rounded-full bg-green-500" />
          </div>
          <span>{totalTime}</span>
        </div>
      </div>

      {/* Spotify Logo */}
      <div className="ml-1 flex h-full shrink-0 items-center">
        <FaSpotify className="text-xl text-[#1DB954]" />
      </div>
    </div>
  );
};

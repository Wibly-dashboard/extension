import {
  FaSpotify,
  FaPlay,
  FaStepBackward,
  FaStepForward,
  FaRandom,
} from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";

export const SpotifyWidget = () => {
  return (
    <div className="flex h-[80px] w-[464px] items-center gap-3 rounded-xl bg-[#fefefe] px-3 text-black font-pretendard">
      {/* Album Cover */}
      <img
        src="https://i.scdn.co/image/ab67616d0000b273428d2255141c2119409a31b2"
        alt="Touch The Sky Album Cover"
        className="h-14 w-14 shrink-0 rounded-md object-cover"
      />

      {/* Track Information */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="truncate text-sm font-semibold">Touch The Sky</span>
        <span className="truncate text-xs text-[#b3b3b3]">Kanye West</span>
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
          <span>0:00</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#4d4d4d]">
            <div className="h-full w-[35%] rounded-full bg-white" />
          </div>
          <span>3:57</span>
        </div>
      </div>

      {/* Spotify Logo */}
      <div className="ml-1 flex h-full shrink-0 items-center">
        <FaSpotify className="text-xl text-[#1DB954]" />
      </div>
    </div>
  );
};

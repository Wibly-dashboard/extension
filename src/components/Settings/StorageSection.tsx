import { useState } from "react";
import { FaEye, FaEyeSlash, FaPen, FaTrash } from "react-icons/fa";
import { SERVICES } from "../../hooks/useTokens";
import type { ServiceId, TokenMap } from "../../types/settings";
import { SpotifyTokenCard } from "./SpotifyTokenCard";

type StorageSectionProps = {
  tokens: TokenMap;
  onChange: (tokens: TokenMap) => void;
};

const maskToken = (token: string) => `${"•".repeat(12)}${token.slice(-4)}`;

const formatDate = (iso: string) => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ko-KR");
};

const ICON_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white";

export const StorageSection = ({ tokens, onChange }: StorageSectionProps) => {
  const [editing, setEditing] = useState<{ id: ServiceId; value: string } | null>(null);
  const [visibleId, setVisibleId] = useState<ServiceId | null>(null);

  const saveEditing = () => {
    if (!editing) return;

    const token = editing.value.trim();
    if (!token) return;

    onChange({ ...tokens, [editing.id]: { token, updatedAt: new Date().toISOString() } });
    setEditing(null);
  };

  const removeToken = (id: ServiceId) => {
    onChange(Object.fromEntries(Object.entries(tokens).filter(([key]) => key !== id)));
  };

  return (
    <div>
      <p className="py-3 text-xs text-white/60">
        외부 API 위젯이 사용하는 토큰입니다. 위젯은 여기 저장된 값을 읽어 동작합니다.
      </p>

      <ul className="flex flex-col gap-3">
        {SERVICES.map((service) => {
          // Spotify는 Refresh Token으로 액세스 토큰을 자동 발급하므로 별도 카드에서 관리한다 (chrome.storage.local)
          if (service.id === "spotify") return <SpotifyTokenCard key={service.id} />;

          const saved = tokens[service.id];
          const isEditing = editing?.id === service.id;

          return (
            <li key={service.id} className="rounded-xl border border-white/15 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        saved ? "bg-green-400/20 text-green-200" : "bg-white/15 text-white/60"
                      }`}
                    >
                      {saved ? "연결됨" : "연결 안 됨"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/60">{service.description}</p>
                </div>

                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-1">
                    {saved ? (
                      <>
                        <button
                          type="button"
                          aria-label={`${service.name} 토큰 ${visibleId === service.id ? "숨기기" : "보기"}`}
                          onClick={() => setVisibleId(visibleId === service.id ? null : service.id)}
                          className={ICON_BUTTON}
                        >
                          {visibleId === service.id ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          type="button"
                          aria-label={`${service.name} 토큰 수정`}
                          onClick={() => setEditing({ id: service.id, value: saved.token })}
                          className={ICON_BUTTON}
                        >
                          <FaPen className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${service.name} 토큰 삭제`}
                          onClick={() => removeToken(service.id)}
                          className={`${ICON_BUTTON} hover:text-red-300`}
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      // TODO: API 리다이렉트 연결로 교체. 지금은 토큰을 직접 입력
                      <button
                        type="button"
                        onClick={() => setEditing({ id: service.id, value: "" })}
                        className="cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white transition-colors duration-200 hover:bg-white/25"
                      >
                        토큰 입력
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveEditing();
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    aria-label={`${service.name} 토큰`}
                    placeholder="토큰을 입력하세요"
                    value={editing.value}
                    onChange={(event) => setEditing({ id: service.id, value: event.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-white/25 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-white/40 focus:border-white/60"
                  />
                  <button
                    type="submit"
                    disabled={!editing.value.trim()}
                    className="cursor-pointer rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-400 disabled:cursor-default disabled:opacity-40"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
                  >
                    취소
                  </button>
                </form>
              ) : (
                saved && (
                  <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-black/25 px-3 py-2">
                    <code className="min-w-0 truncate font-mono text-xs text-white/85">
                      {visibleId === service.id ? saved.token : maskToken(saved.token)}
                    </code>
                    <span className="shrink-0 text-[11px] text-white/50">{formatDate(saved.updatedAt)}</span>
                  </div>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

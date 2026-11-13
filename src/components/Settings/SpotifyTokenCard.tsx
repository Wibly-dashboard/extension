import { useState, type ChangeEvent } from "react";
import { FaEye, FaEyeSlash, FaPen, FaSpotify, FaTrash } from "react-icons/fa";
import {
  getRefreshTokenLifetime,
  registerSpotifyAuth,
  SPOTIFY_CLIENT_ID,
  removeSpotifyAuth,
  SpotifyTokenError,
  useSpotifyAuth,
  type SpotifyAuth,
  type SpotifyAuthError,
  type SpotifyConnectError,
} from "../../hooks/spotifyAuth";
import { loginWithSpotify } from "../../hooks/spotifyLogin";

const ICON_BUTTON =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white";

const INPUT =
  "w-full rounded-lg border border-white/25 bg-black/25 px-3 py-2 font-mono text-xs text-white outline-none placeholder:font-pretendard placeholder:text-white/40 focus:border-white/60";

const REGISTER_ERRORS: Record<SpotifyConnectError, string> = {
  "invalid-refresh-token": "Refresh Token이 잘못되었거나 만료되었습니다. 새로 발급받은 Refresh Token을 입력해 주세요.",
  "invalid-client":
    "Client ID 또는 Client Secret이 올바르지 않습니다. Client Secret으로 발급받은 토큰이라면 Secret도 입력해 주세요.",
  network: "Spotify 서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
  unknown: "토큰을 발급하지 못했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.",
  "login-cancelled":
    "Spotify 로그인이 완료되지 않았습니다. 창을 닫지 않았는데도 실패한다면 Spotify Dashboard의 Redirect URI 등록과 User Management를 확인해 주세요.",
  "login-unavailable": "Spotify 로그인은 크롬 확장 프로그램(새 탭)에서만 사용할 수 있습니다. 토큰을 직접 입력해 주세요.",
  "state-mismatch": "로그인 응답이 올바르지 않습니다. 다시 시도해 주세요.",
};

const toErrorMessage = (error: unknown) =>
  REGISTER_ERRORS[error instanceof SpotifyTokenError ? error.reason : "unknown"];

const SAVED_ERRORS: Partial<Record<SpotifyAuthError, string>> = {
  "invalid-refresh-token": "Refresh Token이 잘못되었거나 만료되었습니다. Spotify에 다시 로그인하거나 새 토큰을 등록해 주세요.",
  "invalid-client": "Client ID 또는 Client Secret이 올바르지 않습니다. 다시 로그인하거나 수정 버튼으로 다시 입력해 주세요.",
};

const maskToken = (token: string) => `${"•".repeat(12)}${token.slice(-4)}`;
const formatDate = (date: Date) => (Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ko-KR"));

type Form = { clientId: string; clientSecret: string; refreshToken: string };

const EMPTY_FORM: Form = { clientId: "", clientSecret: "", refreshToken: "" };

const toForm = (auth: SpotifyAuth): Form => ({
  clientId: auth.clientId === SPOTIFY_CLIENT_ID ? "" : auth.clientId, // 기본 앱이면 빈 칸으로 표시
  clientSecret: auth.clientSecret ?? "",
  refreshToken: auth.refreshToken,
});

type Badge = { label: string; className: string };

const getBadge = (auth: SpotifyAuth | null): Badge => {
  if (!auth) return { label: "연결 안 됨", className: "bg-white/15 text-white/60" };
  if (auth.error) return { label: "토큰 오류", className: "bg-red-400/20 text-red-200" };

  const { status, daysLeft } = getRefreshTokenLifetime(auth.registeredAt);
  if (status === "expired") return { label: "기한 만료", className: "bg-red-400/20 text-red-200" };
  if (status === "expiring") return { label: `만료 임박 D-${daysLeft}`, className: "bg-amber-400/20 text-amber-200" };

  return { label: "연결됨", className: "bg-green-400/20 text-green-200" };
};

/**
 * 설정 > 저장소 > Spotify.
 * 'Spotify 로그인'(PKCE)으로 연결하거나, Refresh Token을 직접 입력하면 바로 액세스 토큰을 발급해 검증하고, 성공하면 chrome.storage.local에 저장한다.
 * (설정 창의 저장 버튼과 관계없이 연결/삭제 즉시 반영)
 */
export const SpotifyTokenCard = () => {
  const { loaded, value: auth } = useSpotifyAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isEditing = form !== null;
  const badge = getBadge(auth);
  const lifetime = auth ? getRefreshTokenLifetime(auth.registeredAt) : null;

  const openForm = (next: Form) => {
    setForm(next);
    setFormError(null);
    setLoginError(null);
  };

  const login = async () => {
    if (loggingIn) return;

    setLoggingIn(true);
    setLoginError(null);

    try {
      await loginWithSpotify();
    } catch (error) {
      setLoginError(toErrorMessage(error));
    } finally {
      setLoggingIn(false);
    }
  };

  const submit = async () => {
    if (!form || submitting) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await registerSpotifyAuth(form);
      setForm(null);
    } catch (error) {
      setFormError(toErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: keyof Form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => prev && { ...prev, [key]: event.target.value });

  return (
    <li className="rounded-xl border border-white/15 bg-white/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Spotify</p>
            {loaded && <span className={`rounded-full px-2 py-0.5 text-[11px] ${badge.className}`}>{badge.label}</span>}
          </div>
          <p className="mt-0.5 text-xs text-white/60">
            Spotify에 로그인하면 액세스 토큰을 자동으로 발급·갱신해 Spotify 위젯에서 사용합니다
          </p>
        </div>

        {loaded && !isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            {auth ? (
              <>
                <button
                  type="button"
                  aria-label="Spotify 다시 로그인"
                  title="Spotify 다시 로그인"
                  disabled={loggingIn}
                  onClick={() => void login()}
                  className={`${ICON_BUTTON} hover:text-[#1DB954] disabled:cursor-default disabled:opacity-40`}
                >
                  <FaSpotify />
                </button>
                <button
                  type="button"
                  aria-label={`Spotify Refresh Token ${visible ? "숨기기" : "보기"}`}
                  onClick={() => setVisible(!visible)}
                  className={ICON_BUTTON}
                >
                  {visible ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button
                  type="button"
                  aria-label="Spotify 토큰 수정"
                  onClick={() => openForm(toForm(auth))}
                  className={ICON_BUTTON}
                >
                  <FaPen className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Spotify 토큰 삭제"
                  onClick={() => {
                    setVisible(false);
                    void removeSpotifyAuth();
                  }}
                  className={`${ICON_BUTTON} hover:text-red-300`}
                >
                  <FaTrash className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openForm(EMPTY_FORM)}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
                >
                  토큰 직접 입력
                </button>
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => void login()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#1DB954] px-3 py-1.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-[#1ed760] disabled:cursor-default disabled:opacity-60"
                >
                  <FaSpotify />
                  {loggingIn ? "로그인 중..." : "Spotify 로그인"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loginError && !isEditing && <p className="mt-3 text-xs text-red-300">{loginError}</p>}

      {isEditing ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            aria-label="Spotify Client ID"
            placeholder="Client ID (선택) — 비워두면 기본 앱 사용. 직접 만든 Spotify 앱으로 발급받은 토큰이면 그 앱의 Client ID 입력"
            value={form.clientId}
            onChange={updateField("clientId")}
            className={INPUT}
          />
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-label="Spotify Client Secret"
            placeholder="Client Secret (선택) — Secret으로 발급받은 토큰이면 입력, PKCE로 발급받았다면 비워두세요"
            value={form.clientSecret}
            onChange={updateField("clientSecret")}
            className={INPUT}
          />
          <input
            autoFocus
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-label="Spotify Refresh Token"
            placeholder="Refresh Token (필수) — /api/token 응답의 refresh_token 값 (AQ...로 시작, access_token 아님)"
            value={form.refreshToken}
            onChange={updateField("refreshToken")}
            className={INPUT}
          />

          {formError && <p className="text-xs text-red-300">{formError}</p>}

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-white/50">
              Refresh Token은 등록일로부터 6개월 동안 사용할 수 있습니다. 연결을 누르면 바로 저장됩니다.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/15 hover:text-white"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !form.refreshToken.trim()}
                className="cursor-pointer rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-400 disabled:cursor-default disabled:opacity-40"
              >
                {submitting ? "확인 중..." : "연결"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        auth &&
        lifetime && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 rounded-lg bg-black/25 px-3 py-2">
              <code className="min-w-0 truncate font-mono text-xs text-white/85">
                {visible ? auth.refreshToken : maskToken(auth.refreshToken)}
              </code>
              <span className="shrink-0 text-[11px] text-white/50">
                등록 {formatDate(new Date(auth.registeredAt))} · 만료 {formatDate(lifetime.expiresAt)}
              </span>
            </div>

            {auth.error && SAVED_ERRORS[auth.error] ? (
              <p className="text-xs text-red-300">{SAVED_ERRORS[auth.error]}</p>
            ) : lifetime.status === "expired" ? (
              <p className="text-xs text-red-300">
                Refresh Token 등록 후 6개월이 지났습니다. 언제든 사용이 중단될 수 있으니 새 Refresh Token을 등록해
                주세요.
              </p>
            ) : (
              lifetime.status === "expiring" && (
                <p className="text-xs text-amber-200">
                  Refresh Token 기한이 {lifetime.daysLeft}일 남았습니다. 만료 전에 새 Refresh Token을 등록해 주세요.
                </p>
              )
            )}
          </div>
        )
      )}
    </li>
  );
};

import { createChromeStore, useChromeStore } from "./chromeStore";

const TOKEN_API = "https://accounts.spotify.com/api/token";

/**
 * 확장 프로그램이 기본으로 사용하는 Spotify 앱의 Client ID (Spotify Developer Dashboard에서 등록).
 * Client ID는 공개되어도 되는 값이다. Client Secret은 절대 코드에 넣지 않는다.
 */
export const SPOTIFY_CLIENT_ID = "50e76023da7146baa456210c981656c6";
const STORAGE_KEY = "spotify-auth";
const REFRESH_LOCK = "spotify-token-refresh";
const ACCESS_TOKEN_MARGIN_MS = 60 * 1000; // 만료 1분 전이면 미리 재발급

/** 리프레시 토큰 유효 기간 (등록일 기준) */
export const REFRESH_TOKEN_LIFETIME_MONTHS = 6;
/** 만료일이 이 일수 이하로 남으면 '만료 임박'으로 알린다 */
export const REFRESH_TOKEN_WARNING_DAYS = 14;

export type SpotifyAuthError =
  | "invalid-refresh-token" // 400 invalid_grant: 리프레시 토큰이 잘못됐거나 만료/취소됨
  | "invalid-client" // Client ID / Client Secret 불일치
  | "network" // 응답을 받지 못함
  | "unknown";

/** 로그인(연결) 과정에서만 생기는 오류까지 포함한 전체 오류 */
export type SpotifyConnectError =
  | SpotifyAuthError
  | "login-cancelled" // 로그인 창을 닫았거나 동의를 거부함 (Redirect URI 미등록도 여기에 해당)
  | "login-unavailable" // chrome.identity를 쓸 수 없는 환경 (개발 서버, Storybook)
  | "state-mismatch"; // 로그인 응답의 state가 요청과 다름

export type SpotifyAuth = {
  clientId: string;
  clientSecret?: string; // Client Secret으로 발급받은 리프레시 토큰일 때만 필요 (PKCE는 불필요)
  refreshToken: string;
  registeredAt: string; // 사용자가 리프레시 토큰을 등록한 시각 (ISO 8601). 6개월 기한 계산 기준
  connectedAt?: number; // 설정에서 마지막으로 연결(등록/수정)한 시각 (ms). 위젯이 다시 불러오는 기준
  accessToken?: string;
  expiresAt?: number; // 액세스 토큰 만료 시각 (ms)
  error?: SpotifyAuthError; // 재발급이 실패해 사용자가 토큰을 다시 등록해야 하는 경우
};

export class SpotifyTokenError extends Error {
  readonly reason: SpotifyConnectError;
  /** 원인 파악용 원문 메시지 (Chrome/Spotify가 돌려준 오류) */
  readonly detail?: string;

  constructor(reason: SpotifyConnectError, detail?: string) {
    super(`[Spotify] token error: ${reason}${detail ? ` (${detail})` : ""}`);
    this.reason = reason;
    this.detail = detail;
  }
}

const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const parseAuth = (saved: unknown): SpotifyAuth | null => {
  if (!saved || typeof saved !== "object") return null;

  const auth = saved as Partial<SpotifyAuth>;
  if (!isString(auth.clientId) || !isString(auth.refreshToken) || !isString(auth.registeredAt)) return null;

  return auth as SpotifyAuth;
};

export const spotifyAuthStore = createChromeStore<SpotifyAuth | null>(STORAGE_KEY, parseAuth);

/** 저장된 Spotify 인증 정보. loaded가 false면 아직 저장소를 읽는 중 */
export const useSpotifyAuth = () => useChromeStore(spotifyAuthStore);

// ---------- 리프레시 토큰 기한 (6개월) ----------

const DAY_MS = 24 * 60 * 60 * 1000;

export const getRefreshTokenExpiry = (registeredAt: string) => {
  const date = new Date(registeredAt);
  date.setMonth(date.getMonth() + REFRESH_TOKEN_LIFETIME_MONTHS);

  return date;
};

export type RefreshTokenLifetime = {
  expiresAt: Date;
  daysLeft: number; // 0 이하면 기한이 지남
  status: "ok" | "expiring" | "expired";
};

export const getRefreshTokenLifetime = (registeredAt: string, now = Date.now()): RefreshTokenLifetime => {
  const expiresAt = getRefreshTokenExpiry(registeredAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - now) / DAY_MS);

  return {
    expiresAt,
    daysLeft,
    status: daysLeft <= 0 ? "expired" : daysLeft <= REFRESH_TOKEN_WARNING_DAYS ? "expiring" : "ok",
  };
};

// ---------- 액세스 토큰 발급 ----------

type TokenRequest = Pick<SpotifyAuth, "clientId" | "clientSecret" | "refreshToken">;
export type TokenResult = Required<Pick<SpotifyAuth, "accessToken" | "expiresAt" | "refreshToken">>;

/**
 * Spotify 토큰 엔드포인트에 요청한다. 실패하면 SpotifyTokenError를 던진다.
 * @param fallbackRefreshToken 응답에 새 리프레시 토큰이 없을 때 유지할 값
 */
export const postSpotifyToken = async (
  body: URLSearchParams,
  headers: Record<string, string> = {},
  fallbackRefreshToken = "",
  now = Date.now,
): Promise<TokenResult> => {
  let response: Response;
  try {
    response = await fetch(TOKEN_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
      body,
    });
  } catch {
    throw new SpotifyTokenError("network");
  }

  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
  };

  if (!response.ok || !data.access_token) {
    if (data.error === "invalid_grant") throw new SpotifyTokenError("invalid-refresh-token");
    if (data.error === "invalid_client" || response.status === 401) throw new SpotifyTokenError("invalid-client");
    throw new SpotifyTokenError("unknown");
  }

  const refreshToken = data.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) throw new SpotifyTokenError("unknown");

  return {
    accessToken: data.access_token,
    expiresAt: now() + (data.expires_in ?? 3600) * 1000,
    // Spotify가 새 리프레시 토큰을 주면 교체한다 (이전 토큰은 무효화될 수 있음)
    refreshToken,
  };
};

/** 리프레시 토큰으로 새 액세스 토큰을 발급받는다. 실패하면 SpotifyTokenError를 던진다. */
export const requestSpotifyToken = (
  { clientId, clientSecret, refreshToken }: TokenRequest,
  now = Date.now,
): Promise<TokenResult> => {
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const headers: Record<string, string> = {};

  if (clientSecret) headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  else body.set("client_id", clientId); // PKCE로 발급받은 토큰

  return postSpotifyToken(body, headers, refreshToken, now);
};

/**
 * 사용자가 입력한 리프레시 토큰으로 액세스 토큰을 발급받아 검증한 뒤 저장한다.
 * 리프레시 토큰이 바뀌지 않았다면(Client Secret만 수정 등) 등록일을 유지한다.
 */
export const registerSpotifyAuth = async (input: TokenRequest) => {
  const request: TokenRequest = {
    clientId: input.clientId.trim() || SPOTIFY_CLIENT_ID, // 비워두면 기본 앱 사용
    clientSecret: input.clientSecret?.trim() || undefined,
    refreshToken: input.refreshToken.trim(),
  };
  const token = await requestSpotifyToken(request);
  const previous = spotifyAuthStore.get().value;
  const keepRegisteredAt = previous && previous.refreshToken === request.refreshToken;

  await spotifyAuthStore.set({
    ...request,
    ...token,
    registeredAt: keepRegisteredAt ? previous.registeredAt : new Date().toISOString(),
    connectedAt: Date.now(),
  });
};

export const removeSpotifyAuth = () => spotifyAuthStore.set(null);

const hasValidAccessToken = (auth: SpotifyAuth): auth is SpotifyAuth & { accessToken: string } =>
  !!auth.accessToken && (auth.expiresAt ?? 0) - ACCESS_TOKEN_MARGIN_MS > Date.now();

// 여러 탭이 동시에 재발급하면 교체된 리프레시 토큰끼리 충돌할 수 있으므로 한 번에 하나만 재발급한다
const withRefreshLock = <T>(task: () => Promise<T>): Promise<T> =>
  typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request(REFRESH_LOCK, task) : task();

/**
 * API 호출에 사용할 액세스 토큰. 만료가 가까우면 리프레시 토큰으로 자동 재발급해 저장한다.
 * @param force API가 401을 응답해 현재 토큰을 더 이상 쓸 수 없을 때 true
 */
export const getSpotifyAccessToken = async (force = false): Promise<string> => {
  const current = spotifyAuthStore.get().loaded ? spotifyAuthStore.get().value : await spotifyAuthStore.reload();

  if (!current) throw new SpotifyTokenError("invalid-refresh-token");
  if (current.error) throw new SpotifyTokenError(current.error);
  if (!force && hasValidAccessToken(current)) return current.accessToken;

  return withRefreshLock(async () => {
    // 잠금을 기다리는 동안 다른 탭이 이미 재발급했을 수 있으므로 저장소에서 다시 읽는다
    const auth = await spotifyAuthStore.reload();

    if (!auth) throw new SpotifyTokenError("invalid-refresh-token");
    if (auth.error) throw new SpotifyTokenError(auth.error);
    if (hasValidAccessToken(auth) && (!force || auth.accessToken !== current.accessToken)) return auth.accessToken;

    try {
      const token = await requestSpotifyToken(auth);
      await spotifyAuthStore.set({ ...auth, ...token, error: undefined });

      return token.accessToken;
    } catch (error) {
      // 토큰 자체가 잘못된 경우에만 저장해 반복 요청을 멈춘다 (네트워크 오류는 다음 주기에 재시도)
      if (
        error instanceof SpotifyTokenError &&
        (error.reason === "invalid-refresh-token" || error.reason === "invalid-client")
      ) {
        await spotifyAuthStore.set({ ...auth, accessToken: undefined, expiresAt: undefined, error: error.reason });
      }

      throw error;
    }
  });
};

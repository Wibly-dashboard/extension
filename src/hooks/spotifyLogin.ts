import { postSpotifyToken, SPOTIFY_CLIENT_ID, spotifyAuthStore, SpotifyTokenError } from "./spotifyAuth";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SCOPES = ["user-read-currently-playing", "user-read-playback-state", "user-modify-playback-state"];

// ---------- PKCE (RFC 7636) ----------

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const randomString = (byteLength: number) => base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));

/** code_verifier를 SHA-256으로 해시한 code_challenge (S256) */
export const createCodeChallenge = async (verifier: string) =>
  base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));

/** 로그인 창이 돌아올 주소. 압축해제 로드 시 확장 프로그램 ID(폴더 경로 기준)에 따라 정해진다 */
export const getSpotifyRedirectUri = () =>
  typeof chrome !== "undefined" && chrome.identity ? chrome.identity.getRedirectURL() : null;

/**
 * Spotify 로그인 창을 띄워 사용자의 동의를 받고, 발급받은 토큰을 저장한다. (Authorization Code + PKCE)
 * Client Secret 없이 동작하므로 사용자가 토큰을 직접 입력할 필요가 없다.
 * 팝업(action)에서 실행하면 로그인 창이 열릴 때 팝업이 닫혀 실패하므로 새 탭 대시보드에서 실행해야 한다.
 */
export const loginWithSpotify = async () => {
  const redirectUri = getSpotifyRedirectUri();
  if (!redirectUri) throw new SpotifyTokenError("login-unavailable");

  const verifier = randomString(64);
  const state = randomString(16);

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.search = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: await createCodeChallenge(verifier),
    state,
  }).toString();

  let responseUrl: string | undefined;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({ url: authorizeUrl.toString(), interactive: true });
  } catch (error) {
    // 창을 닫음 / 동의 거부 / Redirect URI 미등록(Spotify가 오류 페이지를 보여 창을 닫게 됨)
    throw new SpotifyTokenError("login-cancelled", error instanceof Error ? error.message : String(error));
  }

  const params = responseUrl ? new URL(responseUrl).searchParams : null;
  const code = params?.get("code");

  if (!params || params.get("error") || !code)
    throw new SpotifyTokenError("login-cancelled", params?.get("error") ?? "응답에 code가 없습니다");
  if (params.get("state") !== state) throw new SpotifyTokenError("state-mismatch");

  const token = await postSpotifyToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    }),
  );

  await spotifyAuthStore.set({
    clientId: SPOTIFY_CLIENT_ID,
    ...token,
    registeredAt: new Date().toISOString(), // 새 리프레시 토큰이므로 6개월 기한을 다시 시작
    connectedAt: Date.now(),
  });
};

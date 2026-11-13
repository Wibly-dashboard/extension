import { afterEach, describe, expect, it, vi } from "vitest";
import { getRefreshTokenLifetime, requestSpotifyToken, SpotifyTokenError } from "./spotifyAuth";

const DAY_MS = 24 * 60 * 60 * 1000;
const REGISTERED_AT = "2026-01-15T00:00:00.000Z";

describe("getRefreshTokenLifetime", () => {
  it("등록일로부터 6개월 뒤를 만료일로 계산한다", () => {
    const { expiresAt } = getRefreshTokenLifetime(REGISTERED_AT);

    expect(expiresAt.getTime()).toBe(new Date("2026-07-15T00:00:00.000Z").getTime());
  });

  it("만료일까지 14일보다 많이 남으면 ok", () => {
    const now = new Date("2026-07-15T00:00:00.000Z").getTime() - 30 * DAY_MS;

    expect(getRefreshTokenLifetime(REGISTERED_AT, now)).toMatchObject({ status: "ok", daysLeft: 30 });
  });

  it("만료일까지 14일 이하로 남으면 expiring", () => {
    const now = new Date("2026-07-15T00:00:00.000Z").getTime() - 14 * DAY_MS;

    expect(getRefreshTokenLifetime(REGISTERED_AT, now)).toMatchObject({ status: "expiring", daysLeft: 14 });
  });

  it("만료일이 지나면 expired", () => {
    const now = new Date("2026-07-15T00:00:00.000Z").getTime() + DAY_MS;

    expect(getRefreshTokenLifetime(REGISTERED_AT, now).status).toBe("expired");
  });
});

const mockFetch = (status: number, body: unknown) => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
};

describe("requestSpotifyToken", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("성공하면 액세스 토큰과 만료 시각을 반환하고, 새 리프레시 토큰이 오면 교체한다", async () => {
    mockFetch(200, { access_token: "new-access", expires_in: 3600, refresh_token: "rotated" });

    const result = await requestSpotifyToken({ clientId: "id", refreshToken: "old" }, () => 1000);

    expect(result).toEqual({ accessToken: "new-access", expiresAt: 1000 + 3600 * 1000, refreshToken: "rotated" });
  });

  it("새 리프레시 토큰이 없으면 기존 토큰을 유지한다", async () => {
    mockFetch(200, { access_token: "new-access", expires_in: 3600 });

    const result = await requestSpotifyToken({ clientId: "id", refreshToken: "old" });

    expect(result.refreshToken).toBe("old");
  });

  it("Secret이 없으면 client_id를 본문에, 있으면 Basic 인증 헤더로 보낸다", async () => {
    const fetchMock = mockFetch(200, { access_token: "a", expires_in: 3600 });

    await requestSpotifyToken({ clientId: "id", refreshToken: "r" });
    const [, pkceInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((pkceInit.body as URLSearchParams).get("client_id")).toBe("id");

    await requestSpotifyToken({ clientId: "id", clientSecret: "secret", refreshToken: "r" });
    const [, secretInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect((secretInit.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa("id:secret")}`);
  });

  it.each([
    [400, { error: "invalid_grant" }, "invalid-refresh-token"],
    [400, { error: "invalid_client" }, "invalid-client"],
    [401, {}, "invalid-client"],
    [500, {}, "unknown"],
  ])("응답 %i %j 는 %s 오류", async (status, body, reason) => {
    mockFetch(status, body);

    await expect(requestSpotifyToken({ clientId: "id", refreshToken: "r" })).rejects.toMatchObject({ reason });
  });

  it("응답을 받지 못하면 network 오류", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(requestSpotifyToken({ clientId: "id", refreshToken: "r" })).rejects.toBeInstanceOf(SpotifyTokenError);
  });
});

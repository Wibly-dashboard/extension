import MOCK_TOKENS from "../data/MOCK_TOKENS.json";
import type { ServiceId, TokenMap } from "../types/settings";
import { createLocalStore, useLocalStore } from "./localStore";

// 저장소에서 관리하는 외부 API 서비스 목록
export const SERVICES: { id: ServiceId; name: string; description: string }[] = [
  { id: "spotify", name: "Spotify", description: "Spotify 위젯에서 재생 정보를 불러올 때 사용" },
  { id: "google-calendar", name: "Google Calendar", description: "캘린더 위젯에서 일정을 불러올 때 사용" },
];

// TODO: 위젯 연결 시 API 리다이렉트로 토큰을 발급받아 저장하는 방식으로 교체. 지금은 목 데이터를 초기값으로 사용
const parseTokens = (saved: unknown): TokenMap =>
  saved && typeof saved === "object" ? (saved as TokenMap) : (MOCK_TOKENS as TokenMap);

export const tokenStore = createLocalStore<TokenMap>("dashboard-tokens", parseTokens);

/** 저장소에 있는 서비스 토큰. 연결되지 않았다면 undefined. 저장소에서 수정/삭제하면 즉시 반영된다. */
export const useServiceToken = (service: ServiceId): string | undefined => useLocalStore(tokenStore)[service]?.token;

import type { NavLink } from "../types/settings";
import { createLocalStore, useLocalStore } from "./localStore";

export const DEFAULT_NAV_LINKS: NavLink[] = ["https://github.com/apple-touch-icon.png"].map((imageUrl, index) => ({
  id: `default-${index}`,
  imageUrl,
  href: "https://github.com/",
}));

const isNavLink = (value: unknown): value is NavLink => {
  if (!value || typeof value !== "object") return false;

  const link = value as Record<string, unknown>;

  return typeof link.id === "string" && typeof link.imageUrl === "string" && typeof link.href === "string";
};

// 저장된 값이 없으면 기본 링크를 사용하고, 형식이 잘못된 항목은 버린다
const parseNavLinks = (saved: unknown): NavLink[] =>
  Array.isArray(saved) ? saved.filter(isNavLink) : DEFAULT_NAV_LINKS;

export const navLinksStore = createLocalStore<NavLink[]>("dashboard-nav-links", parseNavLinks);

/** 하단 네비게이터의 링크 목록. 설정에서 저장하면 즉시 다시 렌더링된다. */
export const useNavLinks = () => useLocalStore(navLinksStore);

/** 스킴이 없는 주소(예: naver.com)는 https://를 붙여 외부 사이트로 열리게 한다 */
export const normalizeUrl = (value: string) => {
  const trimmed = value.trim();

  return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

import type { NavLink } from "../types/settings";
import { createLocalStore, useLocalStore } from "./localStore";

export const DEFAULT_NAV_LINKS: NavLink[] = [
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png",
  "https://assets.icon.museum/icons/f4d74646-090f-4068-9d39-553a14373389.png",
  "https://assets.icon.museum/icons/32434c98-7fd4-437e-994e-7a73155a0012.png",
  "https://assets.icon.museum/icons/9851e99f-2d59-46d4-8945-a5439897dc22.png",
  "https://assets.icon.museum/icons/334a501e-b555-42bd-a170-658c17dd5fee.jpg",
].map((imageUrl, index) => ({ id: `default-${index}`, imageUrl, href: "https://example.com" }));

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

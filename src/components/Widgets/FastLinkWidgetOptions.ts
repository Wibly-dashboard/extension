import { normalizeUrl } from "../../hooks/useNavLinks";

/** 새로 추가한 빠른 링크 위젯의 기본값 */
export const DEFAULT_LINK_URL = "https://www.google.com";
export const DEFAULT_LINK_NAME = "Google";
export const DEFAULT_LINK_IMAGE_URL = "https://www.google.com/s2/favicons?domain=www.google.com&sz=128";

/** 편집 창에 입력한 링크 원문 (입력 중인 값을 그대로 보여주기 위해 정규화하지 않는다) */
export const parseLinkUrl = (value: unknown): string => (typeof value === "string" ? value : DEFAULT_LINK_URL);

export const parseLinkName = (value: unknown): string => (typeof value === "string" ? value : DEFAULT_LINK_NAME);

export const parseLinkImageUrl = (value: unknown): string =>
  typeof value === "string" ? value : DEFAULT_LINK_IMAGE_URL;

export const parseShowLinkName = (value: unknown): boolean => (typeof value === "boolean" ? value : true);

/** 사용자가 이름·아이콘을 직접 고쳤는지 여부. true면 링크를 바꿔도 자동으로 덮어쓰지 않는다 */
export const parseEdited = (value: unknown): boolean => value === true;

/** 위젯을 눌렀을 때 이동할 주소. 비어 있으면 이동하지 않는다 */
export const toLinkHref = (linkUrl: string): string | undefined => (linkUrl.trim() ? normalizeUrl(linkUrl) : undefined);

/**
 * 링크 주소에서 사이트 이름을 만든다. 찾지 못하면 null
 * 예: https://www.naver.com/news → "Naver", m.youtube.com → "Youtube"
 * (확장 프로그램이 모든 사이트의 페이지를 읽을 권한이 없어 <title> 대신 도메인을 사용한다)
 */
export const getSiteName = (href: string): string | null => {
  let hostname: string;

  try {
    hostname = new URL(normalizeUrl(href)).hostname;
  } catch {
    return null;
  }

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return null;

  // www, m 같은 접두어와 co.kr 같은 2단계 최상위 도메인을 건너뛰고 대표 이름을 고른다
  const withoutPrefix = ["www", "m", "mobile"].includes(labels[0]) ? labels.slice(1) : labels;
  const secondLevel = withoutPrefix.at(-2) ?? "";
  const isCompoundTld = withoutPrefix.length >= 3 && ["co", "or", "go", "ac", "ne", "com", "net", "org"].includes(secondLevel);
  const name = isCompoundTld ? withoutPrefix.at(-3) : secondLevel;

  return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
};

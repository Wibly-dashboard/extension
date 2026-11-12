import { normalizeUrl } from "./useNavLinks";

const LOAD_TIMEOUT_MS = 5000;

// 이미지가 실제로 로드되고 최소 크기 이상인지 확인 (작은 기본 아이콘을 걸러내기 위함)
const loadImage = (src: string, minSize: number) =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    function finish(ok: boolean) {
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(ok);
    }

    image.onload = () => finish(image.naturalWidth >= minSize);
    image.onerror = () => finish(false);
    image.src = src;
  });

/**
 * 링크 주소로 사이트 아이콘 URL을 찾는다. 찾지 못하면 null.
 * 화질이 좋은 순서대로 시도한다: apple-touch-icon → Google 파비콘 서비스 → /favicon.ico
 */
export const findSiteIcon = async (href: string): Promise<string | null> => {
  let url: URL;

  try {
    url = new URL(normalizeUrl(href));
  } catch {
    return null;
  }

  if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return null;

  const candidates = [
    { src: `${url.origin}/apple-touch-icon.png`, minSize: 32 },
    // 아이콘이 없는 사이트는 16px 기본 지구본 이미지를 돌려주므로 32px 미만은 실패로 본다
    { src: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`, minSize: 32 },
    { src: `${url.origin}/favicon.ico`, minSize: 1 },
  ];

  for (const candidate of candidates) {
    if (await loadImage(candidate.src, candidate.minSize)) return candidate.src;
  }

  return null;
};

import { useEffect, useState } from "react";

/** 같은 커버를 다시 분석하지 않도록 URL별로 추출한 색을 기억한다 */
const colorCache = new Map<string, string>();

const SAMPLE_SIZE = 32;

/**
 * 이미지 픽셀을 4bit씩 양자화해 가장 많이 쓰인 색 묶음을 찾고, 그 묶음의 평균색을 돌려준다.
 * 거의 검정/흰색인 픽셀은 배경 여백인 경우가 많아 제외하고, 남는 게 없으면 전체 평균을 쓴다.
 */
const extractDominantColor = (image: HTMLImageElement): string | null => {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;

    totalR += r;
    totalG += g;
    totalB += b;
    total++;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 24 || min > 232) continue;

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  if (total === 0) return null;

  let best: { count: number; r: number; g: number; b: number } | undefined;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }

  const [r, g, b] = best
    ? [best.r / best.count, best.g / best.count, best.b / best.count]
    : [totalR / total, totalG / total, totalB / total];

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

/** 앨범 커버 URL에서 대표 색을 추출한다. url이 없으면 아무것도 하지 않는다 */
export const useAlbumColor = (url: string | undefined) => {
  const [result, setResult] = useState<{ url: string; color: string } | null>(null);

  useEffect(() => {
    if (!url || colorCache.has(url)) return;

    let cancelled = false;
    const image = new Image();
    // 캔버스에서 픽셀을 읽으려면 CORS 허용 이미지여야 한다 (i.scdn.co는 허용)
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const color = extractDominantColor(image);
        if (!color) return;
        colorCache.set(url, color);
        if (!cancelled) setResult({ url, color });
      } catch {
        // CORS로 캔버스가 오염되면 색 추출을 포기하고 기존 색을 유지한다
      }
    };
    image.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return undefined;

  // 새 커버의 색을 추출하는 동안에는 직전 곡의 색을 유지해서, 추출이 끝나면 이전 색 → 새 색으로 자연스럽게 넘어가게 한다
  return colorCache.get(url) ?? result?.color;
};

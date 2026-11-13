import whatsNew from "../data/WHATS_NEW.md?raw";
import { createLocalStore, useLocalStore } from "./localStore";

// 새 소식 문서의 가장 위 버전 제목(## ...)을 최신 소식의 식별값으로 사용한다.
// 문구 수정이 아닌, 새 버전 항목이 추가됐을 때만 다시 '읽지 않음'이 된다.
const LATEST_NEWS_ID = whatsNew.match(/^##\s+(.+)$/m)?.[1].trim() ?? "";

const newsReadStore = createLocalStore<string | null>("dashboard-news-read", (saved) =>
  typeof saved === "string" ? saved : null,
);

/** 사용자가 최신 새 소식을 아직 읽지 않았으면 true */
export const useHasUnreadNews = () => useLocalStore(newsReadStore) !== LATEST_NEWS_ID && LATEST_NEWS_ID !== "";

/** 최신 새 소식을 읽음으로 표시 */
export const markNewsAsRead = () => {
  if (newsReadStore.get() !== LATEST_NEWS_ID) newsReadStore.set(LATEST_NEWS_ID);
};

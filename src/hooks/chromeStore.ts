import { useSyncExternalStore } from "react";

// 크롬 확장으로 실행 중이면 chrome.storage.local을, 개발 서버/Storybook처럼 chrome API가 없으면 localStorage를 사용한다.
// chrome.storage.local은 확장 프로그램 페이지에서만 접근할 수 있어 웹 페이지 스크립트로부터 안전하고, 기기 간 동기화도 되지 않는다.
const hasChromeStorage = () => typeof chrome !== "undefined" && !!chrome.storage?.local;

const readStorage = async (key: string): Promise<unknown> => {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key);

    return result[key];
  }

  try {
    const raw = localStorage.getItem(key);

    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const writeStorage = async (key: string, value: unknown) => {
  if (hasChromeStorage()) {
    if (value === null || value === undefined) await chrome.storage.local.remove(key);
    else await chrome.storage.local.set({ [key]: value });

    return;
  }

  if (value === null || value === undefined) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
};

export type ChromeStoreSnapshot<T> = { loaded: boolean; value: T };

export type ChromeStore<T> = {
  /** 현재 값. 저장소에서 처음 읽어오기 전에는 loaded가 false */
  get: () => ChromeStoreSnapshot<T>;
  /** 저장소에서 다시 읽어 최신 값으로 갱신한다 (다른 탭에서 바뀐 값을 확실히 반영해야 할 때 사용) */
  reload: () => Promise<T>;
  set: (next: T) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
};

/** chrome.storage.local에 보관되는 비동기 전역 상태. 값이 바뀌면 모든 탭의 구독 컴포넌트가 다시 렌더링된다. */
export const createChromeStore = <T>(key: string, parse: (saved: unknown) => T): ChromeStore<T> => {
  let snapshot: ChromeStoreSnapshot<T> = { loaded: false, value: parse(undefined) };
  const listeners = new Set<() => void>();

  const update = (value: T) => {
    snapshot = { loaded: true, value };
    listeners.forEach((listener) => listener());
  };

  const reload = async () => {
    let value: T;

    try {
      value = parse(await readStorage(key));
    } catch {
      value = parse(undefined);
    }

    update(value);

    return value;
  };

  if (typeof window !== "undefined") {
    void reload();

    // 다른 탭(새 탭 페이지, 팝업)에서 값을 바꾼 경우에도 반영
    if (hasChromeStorage()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && key in changes) update(parse(changes[key].newValue));
      });
    } else {
      window.addEventListener("storage", (event) => {
        if (event.key === key) void reload();
      });
    }
  }

  return {
    get: () => snapshot,
    reload,
    set: async (next) => {
      await writeStorage(key, next);
      update(next);
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export const useChromeStore = <T>(store: ChromeStore<T>): ChromeStoreSnapshot<T> =>
  useSyncExternalStore(store.subscribe, store.get);

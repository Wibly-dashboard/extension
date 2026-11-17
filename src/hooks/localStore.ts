import { useSyncExternalStore } from "react";
import { readItem, subscribeItem, writeItem } from "./storage";

export type LocalStore<T> = {
  get: () => T;
  /** 저장에 성공하면 true. 실패(용량 초과 등)하면 상태를 바꾸지 않고 false를 반환한다. */
  set: (next: T) => boolean;
  subscribe: (listener: () => void) => () => void;
};

// 동기로 읽고 쓰는 전역 상태. 값이 바뀌면 구독 중인 모든 컴포넌트가 새로고침 없이 다시 렌더링된다.
// 확장 프로그램에서는 chrome.storage.local, 개발 서버(localhost)에서는 localStorage에 저장된다 (storage.ts)
export const createLocalStore = <T>(key: string, parse: (saved: unknown) => T): LocalStore<T> => {
  const read = (saved: unknown): T => {
    try {
      return parse(saved);
    } catch {
      return parse(undefined);
    }
  };

  // 확장 프로그램에서는 initStorage()가 끝난 뒤 캐시를 읽어야 하므로 처음 사용할 때 읽는다
  let state: T;
  let loaded = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const get = () => {
    if (!loaded) {
      state = read(readItem(key));
      loaded = true;
    }

    return state;
  };

  // 다른 탭에서 설정을 바꾼 경우에도 반영
  subscribeItem(key, (saved) => {
    state = read(saved);
    loaded = true;
    notify();
  });

  return {
    get,
    set: (next) => {
      const previous = get();
      const saved = writeItem(key, next, () => {
        // 브라우저 저장소에 비동기로 저장하다 실패하면 이전 값으로 되돌린다
        if (state !== next) return;

        state = previous;
        notify();
      });

      if (!saved) return false;

      state = next;
      notify();

      return true;
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export const useLocalStore = <T>(store: LocalStore<T>): T => useSyncExternalStore(store.subscribe, store.get);

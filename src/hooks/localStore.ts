import { useSyncExternalStore } from "react";

export type LocalStore<T> = {
  get: () => T;
  /** 저장에 성공하면 true. 실패(용량 초과 등)하면 상태를 바꾸지 않고 false를 반환한다. */
  set: (next: T) => boolean;
  subscribe: (listener: () => void) => () => void;
};

// localStorage에 보관되는 전역 상태. 값이 바뀌면 구독 중인 모든 컴포넌트가 새로고침 없이 다시 렌더링된다.
export const createLocalStore = <T>(key: string, parse: (saved: unknown) => T): LocalStore<T> => {
  const read = (raw: string | null): T => {
    try {
      return parse(raw === null ? undefined : JSON.parse(raw));
    } catch {
      return parse(undefined);
    }
  };

  const readStorage = () => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  let state = read(readStorage());
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  // 다른 탭에서 설정을 바꾼 경우에도 반영
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;

      state = read(event.newValue);
      notify();
    });
  }

  return {
    get: () => state,
    set: (next) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        return false;
      }

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

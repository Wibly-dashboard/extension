// 저장소 백엔드 선택
// - 확장 프로그램으로 실행 중이면(chrome.storage.local 사용 가능) 브라우저 저장소(chrome.storage.local)에 저장한다.
// - npm run dev(localhost), Storybook처럼 chrome API가 없으면 localStorage에 저장한다.
//
// chrome.storage.local은 비동기 API라서, 앱 시작 시 initStorage()로 전체 값을 메모리 캐시에 읽어 두고
// 이후 읽기는 캐시에서 동기로, 쓰기는 캐시를 먼저 바꾼 뒤 비동기로 저장한다.

export const isExtensionStorage = () => typeof chrome !== "undefined" && !!chrome.storage?.local;

const cache = new Map<string, unknown>();
let initPromise: Promise<void> | null = null;

// chrome.storage.onChanged는 다른 탭뿐 아니라 이 탭에서 저장한 값도 비동기로 늦게 알려준다.
// 빠르게 입력하는 중에 이전 저장의 알림이 도착해 최신 값을 덮어쓰면, 입력값이 잠깐 되돌아가 한글 조합 중 글자가 두 번 입력된다.
// 그래서 이 탭이 저장한 값을 순서대로 기록해 두고, 그 알림은 건너뛴다.
const pendingWrites = new Map<string, string[]>();
const keyListeners = new Map<string, Set<(value: unknown) => void>>();

const serialize = (value: unknown) => (value === undefined ? "undefined" : JSON.stringify(value));

const addPendingWrite = (key: string, serialized: string) => {
  const queue = pendingWrites.get(key) ?? [];
  queue.push(serialized);
  pendingWrites.set(key, queue);
};

const removePendingWrite = (key: string, serialized: string) => {
  const queue = pendingWrites.get(key);
  const index = queue?.indexOf(serialized) ?? -1;
  if (queue && index >= 0) queue.splice(index, 1);
};

/** 이 탭이 저장해서 돌아온 알림이면 기록에서 지우고 true */
const consumeOwnWrite = (key: string, newValue: unknown) => {
  const queue = pendingWrites.get(key);
  if (!queue?.length || queue[0] !== serialize(newValue)) return false;

  queue.shift();
  return true;
};

const parseJson = (raw: string | null): unknown => {
  if (raw === null) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

// 이전 버전은 확장 프로그램에서도 localStorage에 저장했으므로, 브라우저 저장소에 없는 값은 한 번 옮겨 온다
const migrateFromLocalStorage = async () => {
  let keys: string[];

  try {
    keys = Object.keys(localStorage);
  } catch {
    return;
  }

  const migrated: Record<string, unknown> = {};

  keys.forEach((key) => {
    if (cache.has(key)) return;

    const value = parseJson(localStorage.getItem(key));
    if (value !== undefined) migrated[key] = value;
  });

  const migratedKeys = Object.keys(migrated);
  if (migratedKeys.length === 0) return;

  try {
    await chrome.storage.local.set(migrated);
    migratedKeys.forEach((key) => {
      cache.set(key, migrated[key]);
      localStorage.removeItem(key);
    });
  } catch (error) {
    // 옮기지 못하면 localStorage에 그대로 남겨 다음 실행 때 다시 시도한다
    console.error("[storage] localStorage → chrome.storage.local 이전 실패", error);
  }
};

/** 앱을 렌더링하기 전에 한 번 호출한다. 확장 프로그램이 아니면 아무것도 하지 않는다. */
export const initStorage = (): Promise<void> => {
  if (!isExtensionStorage()) return Promise.resolve();

  initPromise ??= (async () => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;

      Object.entries(changes).forEach(([key, change]) => {
        // 이 탭이 저장한 값은 캐시에 이미 반영되어 있다 (늦게 온 알림으로 최신 값을 덮어쓰지 않는다)
        if (consumeOwnWrite(key, change.newValue)) return;

        if (change.newValue === undefined) cache.delete(key);
        else cache.set(key, change.newValue);

        keyListeners.get(key)?.forEach((listener) => listener(change.newValue));
      });
    });

    try {
      const saved = await chrome.storage.local.get(null);
      Object.entries(saved).forEach(([key, value]) => cache.set(key, value));
    } catch (error) {
      console.error("[storage] chrome.storage.local 읽기 실패", error);
    }

    await migrateFromLocalStorage();
  })();

  return initPromise;
};

/** 저장된 값을 동기로 읽는다. 없거나 읽을 수 없으면 undefined */
export const readItem = (key: string): unknown => {
  if (isExtensionStorage()) return cache.get(key);

  try {
    return parseJson(localStorage.getItem(key));
  } catch {
    return undefined;
  }
};

/**
 * 값을 저장한다. null/undefined면 삭제한다.
 * localStorage는 즉시 결과(성공 여부)를 돌려주고, 브라우저 저장소는 캐시에 바로 반영한 뒤 비동기로 저장하며
 * 저장에 실패하면 onFailure를 호출한다.
 */
export const writeItem = (key: string, value: unknown, onFailure?: (error: unknown) => void): boolean => {
  const remove = value === null || value === undefined;

  if (isExtensionStorage()) {
    const previous = cache.get(key);

    if (remove) cache.delete(key);
    else cache.set(key, value);

    const serialized = serialize(remove ? undefined : value);
    addPendingWrite(key, serialized);

    (remove ? chrome.storage.local.remove(key) : chrome.storage.local.set({ [key]: value })).catch((error) => {
      // 저장에 실패하면 알림이 오지 않으므로 기록에서 지운다
      removePendingWrite(key, serialized);

      if (cache.get(key) === (remove ? undefined : value)) {
        if (previous === undefined) cache.delete(key);
        else cache.set(key, previous);
      }

      console.error(`[storage] "${key}" 저장 실패`, error);
      onFailure?.(error);
    });

    return true;
  }

  try {
    if (remove) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch {
    return false;
  }
};

/** 다른 탭(새 탭 페이지, 팝업 등)에서 값이 바뀌면 호출된다 */
export const subscribeItem = (key: string, listener: (value: unknown) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};

  if (isExtensionStorage()) {
    // initStorage()의 onChanged 리스너가 이 탭이 저장한 알림을 걸러낸 뒤 호출한다
    const listeners = keyListeners.get(key) ?? new Set();
    listeners.add(listener);
    keyListeners.set(key, listeners);

    return () => listeners.delete(listener);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) listener(parseJson(event.newValue));
  };

  window.addEventListener("storage", handleStorage);

  return () => window.removeEventListener("storage", handleStorage);
};

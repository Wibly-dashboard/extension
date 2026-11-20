import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ChangeListener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => void;

/**
 * chrome.storage.local 흉내: 실제처럼 저장 결과를 onChanged로 비동기(다음 타이머)에 알려준다.
 * 이 탭에서 저장한 값도 알림이 오는 점이 실제 브라우저와 같다.
 */
const createFakeChrome = () => {
  const data: Record<string, unknown> = {};
  const listeners = new Set<ChangeListener>();
  const emit = (key: string, newValue: unknown) =>
    listeners.forEach((listener) => listener({ [key]: { newValue } }, "local"));

  return {
    emit,
    chrome: {
      storage: {
        local: {
          get: async () => ({ ...data }),
          set: async (items: Record<string, unknown>) => {
            Object.entries(items).forEach(([key, value]) => {
              data[key] = value;
              setTimeout(() => emit(key, value));
            });
          },
          remove: async (key: string) => {
            delete data[key];
            setTimeout(() => emit(key, undefined));
          },
        },
        onChanged: {
          addListener: (listener: ChangeListener) => listeners.add(listener),
          removeListener: (listener: ChangeListener) => listeners.delete(listener),
        },
      },
    },
  };
};

const setup = async () => {
  const fake = createFakeChrome();
  vi.stubGlobal("chrome", fake.chrome);
  vi.stubGlobal("window", globalThis);
  vi.resetModules();

  const storage = await import("./storage");
  await storage.initStorage();

  return { ...fake, ...storage };
};

describe("storage (확장 프로그램 저장소)", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("빠르게 연달아 저장해도 늦게 온 이전 저장 알림이 최신 값을 덮어쓰지 않는다", async () => {
    const { writeItem, readItem, subscribeItem } = await setup();
    const listener = vi.fn();
    subscribeItem("title", listener);

    // 한글 입력처럼 알림이 오기 전에 값이 여러 번 바뀐다
    writeItem("title", "ㅎ");
    writeItem("title", "하");
    writeItem("title", "한");

    await vi.runAllTimersAsync();

    expect(readItem("title")).toBe("한");
    expect(listener).not.toHaveBeenCalled();
  });

  it("다른 탭에서 바꾼 값은 반영하고 구독자에게 알린다", async () => {
    const { writeItem, readItem, subscribeItem, emit } = await setup();
    const listener = vi.fn();
    subscribeItem("title", listener);

    writeItem("title", "내 값");
    await vi.runAllTimersAsync();

    emit("title", "다른 탭 값");

    expect(readItem("title")).toBe("다른 탭 값");
    expect(listener).toHaveBeenCalledWith("다른 탭 값");
  });
});

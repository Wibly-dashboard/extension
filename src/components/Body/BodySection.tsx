import { useEffect, useRef, useState } from "react";
import Draggable, { type DraggableData } from "react-draggable";
import { DigitalClock } from "../Widgets/DigitalClock";
import { LinkBlock } from "../Widgets/LinkBlock";
import MOCK_LINKS from "../../data/MOCK_LINKS.json";
import { SpotifyWidget } from "../Widgets/SpotifyWidget";
import { GoogleCalendarWidget } from "../Widgets/GoogleCalendar";
import { TodoWidget } from "../Widgets/TodoListWidget";
import { DDayWidget } from "../Widgets/DDayWidget";
import {
  clampPosition,
  REFERENCE_SIZE,
  toPixel,
  toRatio,
  type Position,
  type Size,
} from "./position";

type Rect = Position & {
  width: number;
  height: number;
};

type Widget = {
  id: string;
  component: React.ReactNode;
  position: Position; // 컨테이너 대비 비율(0~1)로 저장되는 위치. 화면 크기가 바뀌어도 배치가 유지됨
};

type WidgetItemProps = {
  widget: Widget;
  pixelPosition: Position; // 현재 컨테이너 크기에서 실제로 렌더링할 픽셀 위치
  isDragging: boolean; // 현재 드래그 중인 위젯인지 여부
  onStart: (id: string) => void; // 드래그 시작 시 위젯 ID를 처리하는 콜백
  onStop: (id: string, data: DraggableData) => void; // 드래그 종료 시 위치를 처리하는 콜백
};

const GRID_SIZE = 5; // 그리드 크기 정의
const WIDGET_GAP = 10; // 위젯 간의 간격을 정의
const CENTER_SNAP_THRESHOLD = 15;
// 비율 좌표를 저장하므로 이전 픽셀 형식(dashboard-widgets)과 섞이지 않도록 키를 분리
const STORAGE_KEY = "dashboard-widgets-v2";

const initialWidgets: Widget[] = [
  // 초기 위젯 배열
  // position: REFERENCE_SIZE 기준 픽셀 좌표 (아래에서 비율로 변환해 사용)

  {
    id: "clock",
    component: <DigitalClock />,
    position: { x: 1065, y: 7.5 },
  },
  {
    id: "todo",
    component: <TodoWidget />,
    position: { x: 2145, y: 260 },
  },
  ...MOCK_LINKS.map((link, index) => {
    const positions = [
      { x: 280, y: 900 },
      { x: 140, y: 900 },
      { x: 70, y: 900 },
      { x: 0, y: 900 },
      { x: 350, y: 900 },
      { x: 210, y: 900 },
      { x: 490, y: 900 },
      { x: 420, y: 900 },
    ];

    return {
      id: `link-${index}`,
      component: <LinkBlock imageUrl={link.imageUrl} href={link.href} />,
      position: positions[index] ?? { x: 0, y: 900 },
    };
  }),
  {
    id: "spotify",
    component: (
      <SpotifyWidget
        albumCoverUrl={
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzL2JHMmJrHtM03_BlEtYokUjk96e3bP5NwsyIfzZEgfrgdIEo07m4c8c&s=10"
        }
        trackTitle={"Touch The Sky"}
        artistName={"Kanye West"}
        currentTime={"0:00"}
        totalTime={"3:57"}
        progressPercentage={35}
        backgroundStyle={"glass"}
      />
    ),
    position: { x: 1033, y: 1050 },
  },
  {
    id: "calendar",
    component: <GoogleCalendarWidget />,
    position: { x: 0, y: 290 },
  },
  {
    id: "DDay",
    component: (
      <DDayWidget
        title={"프로젝트 출시"}
        targetDate={"2026-10-01"}
        startDate={"2026-10-01"}
      />
    ),
    position: { x: 2195, y: 570 },
  },
];

const snapPosition = (value: number, size: number) => {
  // 스냅 위치 계산
  const center = value + size / 2;
  const snappedCenter = Math.round(center / GRID_SIZE) * GRID_SIZE;

  return snappedCenter - size / 2;
};

const isColliding = (a: Rect, b: Rect) => {
  // 충돌 여부 확인
  return (
    a.x < b.x + b.width + WIDGET_GAP &&
    a.x + a.width > b.x - WIDGET_GAP &&
    a.y < b.y + b.height + WIDGET_GAP &&
    a.y + a.height > b.y - WIDGET_GAP
  );
};

const getMaxPosition = (
  // 최대 위치 계산
  size: Size,
  node: HTMLElement,
): Position => {
  return {
    x: Math.max(0, size.width - node.offsetWidth),
    y: Math.max(0, size.height - node.offsetHeight),
  };
};

const getBoundedPosition = (
  // 경계 내 위치 계산
  position: Position,
  size: Size,
  node: HTMLElement,
): Position => {
  const max = getMaxPosition(size, node);

  return clampPosition(
    {
      x: snapPosition(position.x, node.offsetWidth),
      y: snapPosition(position.y, node.offsetHeight),
    },
    max,
  );
};

const snapToContainerCenter = (
  position: Position,
  size: Size,
  node: HTMLElement,
): Position => {
  const centeredX = Math.round((size.width - node.offsetWidth) / 2);
  const widgetCenter = position.x + node.offsetWidth / 2;
  const containerCenter = size.width / 2;

  return Math.abs(widgetCenter - containerCenter) <= CENTER_SNAP_THRESHOLD
    ? { ...position, x: centeredX }
    : position;
};

// 저장된 비율 위치를 현재 컨테이너 크기의 픽셀 위치로 변환 (표시용으로만 경계 보정, 저장값은 변경하지 않음)
const getWidgetPixelPosition = (widget: Widget, size: Size): Position => {
  const pixel = toPixel(widget.position, size);
  const node = document.getElementById(`widget-${widget.id}`);

  return node ? clampPosition(pixel, getMaxPosition(size, node)) : pixel;
};

const WidgetItem = ({
  // 개별 위젯 아이템 컴포넌트
  widget,
  pixelPosition,
  isDragging,
  onStart,
  onStop,
}: WidgetItemProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={pixelPosition}
      bounds="parent"
      handle=".widget-drag-handle"
      onStart={() => {
        onStart(widget.id);
      }}
      onStop={(_, data) => {
        onStop(widget.id, data);
      }}
    >
      <div
        ref={nodeRef}
        id={`widget-${widget.id}`}
        className={`absolute left-0 top-0 w-fit ${isDragging ? "z-50" : "z-0"}`}
      >
        <div className="widget-drag-handle cursor-grab rounded-xl active:cursor-grabbing">
          {widget.component}
        </div>
      </div>
    </Draggable>
  );
};

export const BodySection = () => {
  const containerRef = useRef<HTMLDivElement>(null); // 드래그 가능한 영역의 참조
  const [draggingId, setDraggingId] = useState<string | null>(null); // 현재 드래그 중인 위젯의 ID 상태
  const [containerSize, setContainerSize] = useState<Size>(REFERENCE_SIZE); // 현재 드래그 영역의 크기

  const [widgets, setWidgets] = useState<Widget[]>(() => {
    // 위젯 상태 초기화 (위치는 비율로 보관)
    const defaults = initialWidgets.map((widget) => ({
      ...widget,
      position: toRatio(widget.position, REFERENCE_SIZE),
    }));

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return defaults;

      const savedPositions = JSON.parse(saved) as Record<string, Position>;

      return defaults.map((widget) => ({
        ...widget,
        position: savedPositions[widget.id] ?? widget.position,
      }));
    } catch {
      return defaults;
    }
  });

  const findAvailablePosition = (
    id: string,
    desiredPosition: Position,
    size: Size,
    node: HTMLElement,
    widgetList: Widget[],
  ): Position | undefined => {
    // 다른 위젯의 사각형은 한 번만 측정해 재사용 (탐색 루프 안에서 DOM을 읽지 않도록)
    const otherRects: Rect[] = [];

    for (const widget of widgetList) {
      if (widget.id === id) continue;

      const otherNode = document.getElementById(`widget-${widget.id}`);
      if (!otherNode) continue;

      otherRects.push({
        ...getWidgetPixelPosition(widget, size),
        width: otherNode.offsetWidth,
        height: otherNode.offsetHeight,
      });
    }

    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const isFree = (candidate: Position) => {
      const rect: Rect = { ...candidate, width, height };

      return !otherRects.some((otherRect) => isColliding(rect, otherRect));
    };

    const desiredBounded = getBoundedPosition(desiredPosition, size, node);
    if (isFree(desiredBounded)) return desiredBounded;

    // 컨테이너 안의 그리드 후보를 한 번 훑어 원래 위치에서 가장 가까운 빈 자리를 선택
    const max = getMaxPosition(size, node);
    let best: Position | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let x = 0; x <= max.x; x += GRID_SIZE) {
      for (let y = 0; y <= max.y; y += GRID_SIZE) {
        const dx = x - desiredPosition.x;
        const dy = y - desiredPosition.y;
        const distance = dx * dx + dy * dy;

        // 이미 찾은 후보보다 멀면 충돌 검사를 생략
        if (distance >= bestDistance) continue;

        const candidate = getBoundedPosition({ x, y }, size, node);
        if (!isFree(candidate)) continue;

        best = candidate;
        bestDistance = distance;
      }
    }

    return best;
  };

  const handleStop = (
    // 드래그 종료 시 위치 처리
    id: string,
    data: DraggableData,
  ) => {
    const node = document.getElementById(`widget-${id}`);

    if (!node || containerSize.width <= 0) return;

    const boundedPosition = getBoundedPosition(
      { x: data.x, y: data.y },
      containerSize,
      node,
    );
    const nextPosition = snapToContainerCenter(
      boundedPosition,
      containerSize,
      node,
    );

    setWidgets((prev) => {
      const availablePosition = findAvailablePosition(
        id,
        nextPosition,
        containerSize,
        node,
        prev,
      );
      const currentPosition =
        prev.find((widget) => widget.id === id)?.position ??
        toRatio(nextPosition, containerSize);

      return prev.map((widget) =>
        widget.id === id
          ? {
              ...widget,
              position: availablePosition
                ? toRatio(availablePosition, containerSize)
                : currentPosition,
            }
          : widget,
      );
    });
  };

  useEffect(() => {
    // 드래그 가능한 영역의 크기 변경 시 현재 크기만 갱신 (저장된 위치는 그대로 유지)
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (container.clientWidth <= 0 || container.clientHeight <= 0) return;

      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // 위젯 위치 변경 시 localStorage에 저장 (비율 값만 저장되므로 화면 크기 변화로 덮어써지지 않음)
    const positions = Object.fromEntries(
      widgets.map((widget) => [widget.id, widget.position]),
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [widgets]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[500px] w-full flex-1 overflow-hidden"
    >
      {widgets.map((widget) => (
        <WidgetItem
          key={widget.id}
          widget={widget}
          pixelPosition={getWidgetPixelPosition(widget, containerSize)}
          isDragging={draggingId === widget.id}
          onStart={setDraggingId}
          onStop={(id, data) => {
            handleStop(id, data);
            setDraggingId(null);
          }}
        />
      ))}
    </div>
  );
};

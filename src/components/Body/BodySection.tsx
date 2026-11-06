import { useEffect, useRef, useState } from "react";
import Draggable, { type DraggableData } from "react-draggable";
import { DigitalClock } from "../Widgets/DigitalClock";
import { LinkBlock } from "../Widgets/LinkBlock";
import MOCK_LINKS from "../../data/MOCK_LINKS.json";
import { SpotifyWidget } from "../Widgets/SpotifyWidget";
import { GoogleCalendarWidget } from "../Widgets/GoogleCalendar";
import { TodoWidget } from "../Widgets/TodoListWidget";
import { DDayWidget } from "../Widgets/DDayWidget";

type Position = {
  x: number;
  y: number;
};

type Rect = Position & {
  width: number;
  height: number;
};

type Widget = {
  id: string;
  component: React.ReactNode;
  position: Position; // 초기 위치를 저장하는 position
};

type WidgetItemProps = {
  widget: Widget;
  isDragging: boolean; // 현재 드래그 중인 위젯인지 여부
  onStart: (id: string) => void; // 드래그 시작 시 위젯 ID를 처리하는 콜백
  onStop: (id: string, data: DraggableData) => void; // 드래그 종료 시 위치를 처리하는 콜백
};

const GRID_SIZE = 5; // 그리드 크기 정의
const WIDGET_GAP = 10; // 위젯 간의 간격을 정의
const CENTER_SNAP_THRESHOLD = 15;
const MAX_PLACEMENT_SEARCH_STEPS = 20; // 최대 배치 검색 단계 수
const STORAGE_KEY = "dashboard-widgets";

const initialWidgets: Widget[] = [
  // 초기 위젯 배열
  // position: 위젯의 초기 위치

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
    component: <SpotifyWidget />,
    position: { x: 1033, y: 1050 },
  },
  {
    id: "calendar",
    component: <GoogleCalendarWidget />,
    position: { x: 0, y: 290 },
  },
  {
    id: "DDay",
    component: <DDayWidget />,
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
  container: HTMLElement,
  node: HTMLElement,
): Position => {
  return {
    x: Math.max(0, container.clientWidth - node.offsetWidth),
    y: Math.max(0, container.clientHeight - node.offsetHeight),
  };
};

const getBoundedPosition = (
  // 경계 내 위치 계산
  position: Position,
  container: HTMLElement,
  node: HTMLElement,
): Position => {
  const max = getMaxPosition(container, node);

  return {
    x: Math.min(Math.max(0, snapPosition(position.x, node.offsetWidth)), max.x),
    y: Math.min(
      Math.max(0, snapPosition(position.y, node.offsetHeight)),
      max.y,
    ),
  };
};

const snapToContainerCenter = (
  position: Position,
  container: HTMLElement,
  node: HTMLElement,
): Position => {
  const centeredX = (container.clientWidth - node.offsetWidth) / 2;
  const widgetCenter = position.x + node.offsetWidth / 2;
  const containerCenter = container.clientWidth / 2;

  return Math.abs(widgetCenter - containerCenter) <= CENTER_SNAP_THRESHOLD
    ? { ...position, x: centeredX }
    : position;
};

const WidgetItem = ({
  // 개별 위젯 아이템 컴포넌트
  widget,
  isDragging,
  onStart,
  onStop,
}: WidgetItemProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={widget.position}
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

  const [widgets, setWidgets] = useState<Widget[]>(() => {
    // 위젯 상태 초기화
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return initialWidgets;

      const savedPositions = JSON.parse(saved) as Record<string, Position>;

      return initialWidgets.map((widget) => ({
        ...widget,
        position: savedPositions[widget.id] ?? widget.position,
      }));
    } catch {
      return initialWidgets;
    }
  });

  const checkCollision = (
    id: string,
    position: Position,
    widgetList: Widget[] = widgets,
  ) => {
    // 충돌 체크
    const currentNode = document.getElementById(`widget-${id}`);

    if (!currentNode) return false;

    const currentRect: Rect = {
      ...position,
      width: currentNode.offsetWidth,
      height: currentNode.offsetHeight,
    };

    return widgetList.some((widget) => {
      if (widget.id === id) return false;

      const otherNode = document.getElementById(`widget-${widget.id}`);

      if (!otherNode) return false;

      const otherRect: Rect = {
        ...widget.position,
        width: otherNode.offsetWidth,
        height: otherNode.offsetHeight,
      };

      return isColliding(currentRect, otherRect);
    });
  };

  const findAvailablePosition = (
    id: string,
    desiredPosition: Position,
    container: HTMLElement,
    node: HTMLElement,
    widgetList: Widget[],
  ): Position | undefined => {
    const candidates: Position[] = [desiredPosition];
    const candidateKeys = new Set([
      `${desiredPosition.x}:${desiredPosition.y}`,
    ]);

    const addCandidate = (candidate: Position) => {
      const bounded = getBoundedPosition(candidate, container, node);
      const key = `${bounded.x}:${bounded.y}`;

      if (candidateKeys.has(key)) return;

      candidateKeys.add(key);
      candidates.push(bounded);
    };

    widgetList.forEach((widget) => {
      if (widget.id === id) return;

      const otherNode = document.getElementById(`widget-${widget.id}`);
      if (!otherNode) return;

      [
        {
          x: widget.position.x - node.offsetWidth - WIDGET_GAP,
          y: desiredPosition.y,
        },
        {
          x: widget.position.x + otherNode.offsetWidth + WIDGET_GAP,
          y: desiredPosition.y,
        },
        {
          x: desiredPosition.x,
          y: widget.position.y - node.offsetHeight - WIDGET_GAP,
        },
        {
          x: desiredPosition.x,
          y: widget.position.y + otherNode.offsetHeight + WIDGET_GAP,
        },
      ].forEach(addCandidate);
    });

    for (let step = 1; step <= MAX_PLACEMENT_SEARCH_STEPS; step += 1) {
      for (let offset = -step; offset <= step; offset += 1) {
        [
          {
            x: desiredPosition.x + offset * GRID_SIZE,
            y: desiredPosition.y - step * GRID_SIZE,
          },
          {
            x: desiredPosition.x + offset * GRID_SIZE,
            y: desiredPosition.y + step * GRID_SIZE,
          },
          {
            x: desiredPosition.x - step * GRID_SIZE,
            y: desiredPosition.y + offset * GRID_SIZE,
          },
          {
            x: desiredPosition.x + step * GRID_SIZE,
            y: desiredPosition.y + offset * GRID_SIZE,
          },
        ].forEach(addCandidate);
      }
    }

    return candidates
      .sort(
        (a, b) =>
          Math.hypot(a.x - desiredPosition.x, a.y - desiredPosition.y) -
          Math.hypot(b.x - desiredPosition.x, b.y - desiredPosition.y),
      )
      .find((candidate) => !checkCollision(id, candidate, widgetList));
  };

  const handleStop = (
    // 드래그 종료 시 위치 처리
    id: string,
    data: DraggableData,
  ) => {
    const container = containerRef.current;
    const node = document.getElementById(`widget-${id}`);

    if (!container || !node) return;

    const boundedPosition = getBoundedPosition(
      { x: data.x, y: data.y },
      container,
      node,
    );
    const nextPosition = snapToContainerCenter(
      boundedPosition,
      container,
      node,
    );

    setWidgets((prev) => {
      const availablePosition = findAvailablePosition(
        id,
        nextPosition,
        container,
        node,
        prev,
      );

      return prev.map((widget) =>
        widget.id === id
          ? {
              ...widget,
              position: availablePosition ?? nextPosition,
            }
          : widget,
      );
    });
  };

  useEffect(() => {
    // 드래그 가능한 영역의 크기 변경 시 위젯 위치 조정
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(() => {
      setWidgets((prev) =>
        prev.map((widget) => {
          const node = document.getElementById(`widget-${widget.id}`);

          if (!node) return widget;

          const position = getBoundedPosition(widget.position, container, node);

          return {
            ...widget,
            position,
          };
        }),
      );
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // 위젯 위치 변경 시 localStorage에 저장
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

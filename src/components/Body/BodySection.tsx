import { useEffect, useRef, useState } from "react";
import Draggable, { type DraggableData } from "react-draggable";
import { DigitalClock } from "../Widgets/DigitalClock";
import { LinkBlock } from "../Widgets/LinkBlock";

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
  isDragging: boolean;
  onStart: (id: string) => void;
  onStop: (id: string, data: DraggableData, startPosition: Position) => void;
};

const GRID_SIZE = 10; // 그리드 크기 정의
const WIDGET_GAP = 2; // 위젯 간의 간격을 정의
const STORAGE_KEY = "dashboard-widgets";

const initialWidgets: Widget[] = [
  // 초기 위젯 배열
  // position: 위젯의 초기 위치
  {
    id: "clock",
    component: <DigitalClock />,
    position: { x: 0, y: 0 },
  },
  {
    id: "linkBlock",
    component: <LinkBlock />,
    position: { x: 0, y: 300 },
  },
  {
    id: "linkBlock2",
    component: <LinkBlock />,
    position: { x: 0, y: 300 },
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

const WidgetItem = ({
  // 개별 위젯 아이템 컴포넌트
  widget,
  isDragging,
  onStart,
  onStop,
}: WidgetItemProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPosition = useRef(widget.position);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={widget.position}
      bounds="parent"
      handle=".widget-drag-handle"
      onStart={() => {
        startPosition.current = widget.position;
        onStart(widget.id);
      }}
      onStop={(_, data) => {
        onStop(widget.id, data, startPosition.current);
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

  const checkCollision = (id: string, position: Position) => {
    // 충돌 체크
    const currentNode = document.getElementById(`widget-${id}`);

    if (!currentNode) return false;

    const currentRect: Rect = {
      ...position,
      width: currentNode.offsetWidth,
      height: currentNode.offsetHeight,
    };

    return widgets.some((widget) => {
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

  const handleStop = (
    // 드래그 종료 시 위치 처리
    id: string,
    data: DraggableData,
    lastPosition: Position,
  ) => {
    const container = containerRef.current;
    const node = document.getElementById(`widget-${id}`);

    if (!container || !node) return;

    const nextPosition = getBoundedPosition(
      { x: data.x, y: data.y },
      container,
      node,
    );

    if (checkCollision(id, nextPosition)) {
      // 충돌 시 마지막 위치로 되돌리기
      const fallbackPosition = getBoundedPosition(
        lastPosition,
        container,
        node,
      );

      if (checkCollision(id, fallbackPosition)) {
        setWidgets((prev) =>
          prev.map((widget) =>
            widget.id === id ? { ...widget, position: lastPosition } : widget,
          ),
        );

        return;
      }

      setWidgets((prev) =>
        prev.map((widget) =>
          widget.id === id ? { ...widget, position: fallbackPosition } : widget,
        ),
      );

      return;
    }

    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, position: nextPosition } : widget,
      ),
    );
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
          onStop={(id, data, position) => {
            handleStop(id, data, position);
            setDraggingId(null);
          }}
        />
      ))}
    </div>
  );
};

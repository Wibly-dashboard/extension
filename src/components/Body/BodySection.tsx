import { useEffect, useRef, useState } from "react";
import Draggable, { type DraggableData } from "react-draggable";
import { TestBlock } from "../Widgets/TestBlock";
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
  position: Position;
};

type WidgetItemProps = {
  widget: Widget;
  onStop: (id: string, data: DraggableData, startPosition: Position) => void;
};

const GRID_SIZE = 20;
const WIDGET_GAP = 5;
const STORAGE_KEY = "dashboard-widgets";

const initialWidgets: Widget[] = [
  {
    id: "clock",
    component: <DigitalClock />,
    position: { x: 0, y: 0 },
  },
  {
    id: "test",
    component: <TestBlock />,
    position: { x: 300, y: 0 },
  },
  {
    id: "linkBlock",
    component: <LinkBlock />,
    position: { x: 0, y: 300 },
  },
];

const snapPosition = (value: number) =>
  Math.round(value / GRID_SIZE) * GRID_SIZE;

const isColliding = (a: Rect, b: Rect) => {
  return (
    a.x < b.x + b.width + WIDGET_GAP &&
    a.x + a.width + WIDGET_GAP > b.x &&
    a.y < b.y + b.height + WIDGET_GAP &&
    a.y + a.height + WIDGET_GAP > b.y
  );
};

const getMaxPosition = (
  container: HTMLElement,
  node: HTMLElement,
): Position => {
  return {
    x: Math.max(0, container.clientWidth - node.offsetWidth),
    y: Math.max(0, container.clientHeight - node.offsetHeight),
  };
};

const getBoundedPosition = (
  position: Position,
  container: HTMLElement,
  node: HTMLElement,
): Position => {
  const max = getMaxPosition(container, node);

  return {
    x: Math.min(Math.max(0, snapPosition(position.x)), max.x),
    y: Math.min(Math.max(0, snapPosition(position.y)), max.y),
  };
};

const WidgetItem = ({ widget, onStop }: WidgetItemProps) => {
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
      }}
      onStop={(_, data) => {
        onStop(widget.id, data, startPosition.current);
      }}
    >
      <div
        ref={nodeRef}
        id={`widget-${widget.id}`}
        className="absolute left-0 top-0 w-fit"
      >
        <div className="widget-drag-handle cursor-grab rounded-xl p-4 active:cursor-grabbing">
          {widget.component}
        </div>
      </div>
    </Draggable>
  );
};

export const BodySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [widgets, setWidgets] = useState<Widget[]>(() => {
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
        <WidgetItem key={widget.id} widget={widget} onStop={handleStop} />
      ))}
    </div>
  );
};

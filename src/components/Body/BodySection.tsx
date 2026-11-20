import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Draggable, { type DraggableData } from "react-draggable";
import { AnimatePresence } from "motion/react";
import { FaPen } from "react-icons/fa";
import { useSettings } from "../../hooks/useSettings";
import { deleteWidget, updateWidgetOptions, useAddedWidgets } from "../../hooks/useAddedWidgets";
import { createLocalStore } from "../../hooks/localStore";
import { findCatalogItem } from "../Widgets/widgetCatalog";
import type { WidgetCatalogItem, WidgetOptions } from "../../types/widget";
import { WidgetEditor } from "../WidgetEditor/WidgetEditor";
import {
  clampPosition,
  findNearestFreePosition,
  REFERENCE_SIZE,
  toPixel,
  toRatio,
  type Position,
  type Rect,
  type Size,
} from "./position";

type Widget = {
  id: string;
  name: string; // 편집 창 등에 표시할 위젯 이름
  component: React.ReactNode;
  options: WidgetOptions; // 편집 창에서 저장한 위젯 옵션
  editor?: WidgetCatalogItem["editor"]; // 편집 창에 표시할 위젯별 편집 항목
  position: Position; // 컨테이너 대비 비율(0~1)로 저장되는 위치. 화면 크기가 바뀌어도 배치가 유지됨
};

type WidgetItemProps = {
  widget: Widget;
  pixelPosition: Position; // 현재 컨테이너 크기에서 실제로 렌더링할 픽셀 위치
  isDragging: boolean; // 현재 드래그 중인 위젯인지 여부
  onStart: (id: string) => void; // 드래그 시작 시 위젯 ID를 처리하는 콜백
  onStop: (id: string, data: DraggableData) => void; // 드래그 종료 시 위치를 처리하는 콜백
  isSelected: boolean; // 우클릭으로 선택된 위젯인지 여부
  onSelect: (id: string) => void; // 우클릭 시 위젯을 선택하는 콜백
  onEdit: (id: string) => void; // 연필 아이콘을 눌렀을 때 편집 창을 여는 콜백
};

// 설정에서 바꿀 수 있는 배치 규칙
type LayoutOptions = {
  gridSnap: boolean; // 그리드 정렬 여부
  gridSize: number; // 그리드 크기
  widgetGap: number; // 위젯 간의 간격
};

const CENTER_SNAP_THRESHOLD = 15;
const DRAG_CLICK_THRESHOLD = 3; // 이 거리(px) 이하로 움직이면 드래그가 아닌 클릭으로 본다
// 비율 좌표를 저장하므로 이전 픽셀 형식(dashboard-widgets)과 섞이지 않도록 키를 분리
const STORAGE_KEY = "dashboard-widgets-v2";

// 확장 프로그램에서는 chrome.storage.local, 개발 서버에서는 localStorage에 저장된다
const positionsStore = createLocalStore<Record<string, Position>>(STORAGE_KEY, (saved) =>
  saved && typeof saved === "object" ? (saved as Record<string, Position>) : {},
);

const readSavedPositions = () => positionsStore.get();

const snapPosition = (value: number, size: number, containerLength: number, layout: LayoutOptions) => {
  // 스냅 위치 계산 (그리드 정렬이 꺼져 있으면 그대로 반환)
  if (!layout.gridSnap) return value;

  // 그리드 선을 컨테이너 중앙 기준으로 배치해, 그리드 크기와 화면 크기에 관계없이 중앙이 항상 그리드 선 위에 오게 한다
  const origin = containerLength / 2;
  const center = value + size / 2;
  const snappedCenter = origin + Math.round((center - origin) / layout.gridSize) * layout.gridSize;

  return Math.round(snappedCenter - size / 2);
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
  layout: LayoutOptions,
): Position => {
  const max = getMaxPosition(size, node);

  return clampPosition(
    {
      x: snapPosition(position.x, node.offsetWidth, size.width, layout),
      y: snapPosition(position.y, node.offsetHeight, size.height, layout),
    },
    max,
  );
};

const snapToContainerCenter = (position: Position, size: Size, node: HTMLElement): Position => {
  const centeredX = Math.round((size.width - node.offsetWidth) / 2);
  const widgetCenter = position.x + node.offsetWidth / 2;
  const containerCenter = size.width / 2;

  return Math.abs(widgetCenter - containerCenter) <= CENTER_SNAP_THRESHOLD ? { ...position, x: centeredX } : position;
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
  isSelected,
  onSelect,
  onEdit,
}: WidgetItemProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 }); // 드래그를 시작한 위치
  const wasDraggedRef = useRef(false); // 직전 마우스 조작이 클릭이 아닌 드래그였는지 여부

  return (
    <Draggable
      nodeRef={nodeRef}
      position={pixelPosition}
      bounds="parent"
      handle=".widget-drag-handle"
      onStart={(_, data) => {
        dragStartRef.current = { x: data.x, y: data.y };
        wasDraggedRef.current = false;
        onStart(widget.id);
      }}
      onDrag={(_, data) => {
        // 끝난 위치가 아니라 드래그 중 한 번이라도 멀리 움직였는지로 판단한다
        // (멀리 끌었다가 제자리 근처에 놓아도 클릭으로 처리되어 링크가 열리지 않도록)
        // 손떨림 정도의 작은 움직임은 클릭으로 취급
        if (Math.hypot(data.x - dragStartRef.current.x, data.y - dragStartRef.current.y) > DRAG_CLICK_THRESHOLD) {
          wasDraggedRef.current = true;
        }
      }}
      onStop={(_, data) => {
        onStop(widget.id, data);
      }}
    >
      <div
        ref={nodeRef}
        id={`widget-${widget.id}`}
        // will-change-transform: 위젯을 별도 합성 레이어로 올려 드래그 중 배경과 다른 위젯을 다시 그리지 않게 한다
        className={`absolute left-0 top-0 w-fit will-change-transform ${isDragging || isSelected ? "z-50" : "z-0"}`}
        onClickCapture={(event) => {
          // 드래그를 끝내며 마우스를 놓을 때 발생하는 클릭이 위젯 안의 링크·버튼으로 전달되지 않게 막는다
          if (!wasDraggedRef.current) return;

          wasDraggedRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        onContextMenu={(event) => {
          // 브라우저 기본 메뉴 대신 위젯 선택
          event.preventDefault();
          onSelect(widget.id);
        }}
      >
        <div
          // 선택 테두리는 위젯 모양과 관계없이 모두 같은 모양으로 그린다.
          // outline은 위젯 크기(충돌 판정)에 영향을 주지 않고, offset으로 위젯 모서리와 일정한 간격을 둬 모서리 틈이 생기지 않게 한다
          className={`widget-drag-handle cursor-grab rounded-2xl active:cursor-grabbing ${
            isSelected ? "outline-2 outline-offset-3 outline-blue-500" : ""
          }`}
        >
          {widget.component}
        </div>
        {isSelected && (
          // 드래그 핸들 바깥에 두어 버튼을 눌러도 드래그가 시작되지 않게 한다
          <button
            type="button"
            aria-label={`${widget.name} 편집`}
            onClick={() => onEdit(widget.id)}
            // 위젯 안쪽 모서리에 둬서 위젯이 화면 끝에 있어도 영역 밖으로 잘리지 않게 한다
            className="absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-colors duration-200 hover:bg-blue-400"
          >
            <FaPen className="h-3 w-3" />
          </button>
        )}
      </div>
    </Draggable>
  );
};

export const BodySection = () => {
  const { gridSnap, gridSize, widgetGap } = useSettings();
  const layout: LayoutOptions = { gridSnap, gridSize, widgetGap };
  const containerRef = useRef<HTMLDivElement>(null); // 드래그 가능한 영역의 참조
  const [draggingId, setDraggingId] = useState<string | null>(null); // 현재 드래그 중인 위젯의 ID 상태
  const [containerSize, setContainerSize] = useState<Size>(REFERENCE_SIZE); // 현재 드래그 영역의 크기

  const [selectedId, setSelectedId] = useState<string | null>(null); // 우클릭으로 선택된 위젯 ID
  const [editingId, setEditingId] = useState<string | null>(null); // 편집 창이 열린 위젯 ID
  const closeEditor = useCallback(() => setEditingId(null), []);
  const addedWidgets = useAddedWidgets(); // 위젯 라이브러리에서 추가한 위젯
  const [savedPositions, setSavedPositions] = useState(readSavedPositions); // 사용자가 옮긴 위젯의 비율 위치

  const widgets = useMemo<Widget[]>(
    () =>
      // 위젯 라이브러리에서 추가한 위젯만 표시하고, 사용자가 옮긴 위치가 있으면 그 위치를 사용
      addedWidgets.flatMap((added) => {
        const item = findCatalogItem(added.type);
        const options = added.options ?? {};

        return item
          ? [
              {
                id: added.id,
                name: item.name,
                component: item.render(options),
                options,
                editor: item.editor,
                position: savedPositions[added.id] ?? added.position,
              },
            ]
          : [];
      }),
    [addedWidgets, savedPositions],
  );

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

    return findNearestFreePosition({
      desired: desiredPosition,
      size: { width: node.offsetWidth, height: node.offsetHeight },
      max: getMaxPosition(size, node),
      others: otherRects,
      gap: layout.widgetGap,
      normalize: (candidate) => getBoundedPosition(candidate, size, node, layout),
      gridStep: layout.gridSnap ? layout.gridSize : undefined,
    });
  };

  const handleStop = (
    // 드래그 종료 시 위치 처리
    id: string,
    data: DraggableData,
  ) => {
    const node = document.getElementById(`widget-${id}`);

    if (!node || containerSize.width <= 0) return;

    const boundedPosition = getBoundedPosition({ x: data.x, y: data.y }, containerSize, node, layout);
    const nextPosition = snapToContainerCenter(boundedPosition, containerSize, node);

    const availablePosition = findAvailablePosition(id, nextPosition, containerSize, node, widgets);
    const currentPosition =
      widgets.find((widget) => widget.id === id)?.position ?? toRatio(nextPosition, containerSize);

    setSavedPositions((prev) => ({
      ...prev,
      [id]: availablePosition ? toRatio(availablePosition, containerSize) : currentPosition,
    }));
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
    // 위젯이 선택된 동안: 위젯 바깥을 누르거나 ESC를 누르면 선택 해제
    if (!selectedId) return;

    const handleMouseDown = (event: MouseEvent) => {
      const selectedNode = document.getElementById(`widget-${selectedId}`);

      if (!selectedNode?.contains(event.target as Node)) setSelectedId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId]);

  const editingWidget = widgets.find((widget) => widget.id === editingId);

  useEffect(() => {
    // 위젯 위치 변경 시 저장 (비율 값만 저장되므로 화면 크기 변화로 덮어써지지 않음)
    const positions = Object.fromEntries(widgets.map((widget) => [widget.id, widget.position]));

    positionsStore.set(positions);
  }, [widgets]);

  return (
    // 위젯 위치는 항상 영역 안으로 보정되므로 잘라낼 필요가 없다.
    // overflow를 숨기면 영역 끝에 붙은 위젯의 선택 테두리(바깥 5px)가 잘려 위젯 테두리와 겹쳐 보인다
    <div ref={containerRef} className="relative min-h-[500px] w-full flex-1">
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
          isSelected={selectedId === widget.id}
          onSelect={setSelectedId}
          onEdit={(id) => {
            setSelectedId(null);
            setEditingId(id);
          }}
        />
      ))}
      <AnimatePresence>
        {editingWidget && (
          <WidgetEditor
            name={editingWidget.name}
            onClose={closeEditor}
            onDelete={() => {
              deleteWidget(editingWidget.id);
              closeEditor();
            }}
          >
            {editingWidget.editor?.({
              options: editingWidget.options,
              onChange: (options) => updateWidgetOptions(editingWidget.id, options),
            })}
          </WidgetEditor>
        )}
      </AnimatePresence>
    </div>
  );
};

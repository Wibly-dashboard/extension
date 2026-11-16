import { useCallback, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { AnimatePresence, Reorder, motion, useMotionValue, useTransform } from "motion/react";
import { FaPlus } from "react-icons/fa";
import { PiSquaresFourFill } from "react-icons/pi";
import { navLinksStore, useNavLinks } from "../../hooks/useNavLinks";
import { useSettings } from "../../hooks/useSettings";
import { WidgetLibrary } from "../WidgetLibrary/WidgetLibrary";
import type { NavLink } from "../../types/settings";
import { Settings } from "./Settings";

const STAGGER_DELAY = 0.08;

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 30,
  },
  // custom으로 받은 지연 시간만큼 기다렸다가 등장 (첫 화면에서는 순서대로, 새로 추가된 링크는 바로)
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 12,
      delay,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.2 },
  },
};

// 링크가 추가/삭제될 때 나머지 아이콘과 버튼이 부드럽게 밀려나도록 하는 레이아웃 전환
const layoutTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

const linkIconTransition = { type: "spring" as const, stiffness: 400, damping: 10 };

// 아이콘 상태별 모습. motion의 whileTap은 드래그 중 손을 떼면 해제되지 않아(작아진 채 남음) 직접 상태를 관리한다
const linkIconAnimation = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.15, y: -10 },
  pressed: { scale: 0.9, y: 0 },
};

// 아이콘을 잡고 옮길 때 살짝 띄워서 잡고 있다는 것을 보여준다
const dragLinkAnimation = {
  scale: 1.1,
  zIndex: 10,
  cursor: "grabbing",
};

type DraggableLinkItemProps = {
  link: NavLink;
  delay: number;
  groupRef: RefObject<HTMLUListElement | null>;
  onPointerDownCapture: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: ReactNode;
  // AnimatePresence(popLayout)가 사라지는 아이템의 위치를 재기 위해 넘겨주는 ref
  ref?: Ref<HTMLLIElement>;
};

// 링크 영역 밖(바 바깥이나 고정 버튼 위)으로 끌고 나가지 못하도록 드래그 범위를 제한하는 링크 아이템.
// motion의 dragConstraints(ref)는 드래그 시작 시 한 번만 측정되어, 드래그 중 순서가 바뀌면
// 이전 자리 기준의 범위가 그대로 남아 영역 밖으로 빠져나갈 수 있다.
// onDrag에서 제한하면 제한 전 위치가 한 프레임 그려져 잠깐 튀어나가 보이므로,
// 드래그는 dragX에 그대로 기록하고 화면에는 현재 자리 기준으로 제한한 x만 그린다
const DraggableLinkItem = ({
  link,
  delay,
  groupRef,
  onPointerDownCapture,
  onDragStart,
  onDragEnd,
  children,
  ref,
}: DraggableLinkItemProps) => {
  const itemRef = useRef<HTMLLIElement>(null);
  const setItemRef = (node: HTMLLIElement | null) => {
    itemRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const dragX = useMotionValue(0);
  const x = useTransform(dragX, (value) => {
    const group = groupRef.current;
    const item = itemRef.current;
    if (!group || !item) return value;
    // offsetLeft/offsetWidth는 transform이 적용되지 않은 현재 레이아웃 기준 값이다 (그룹이 offsetParent)
    const min = -item.offsetLeft;
    const max = group.clientWidth - item.offsetLeft - item.offsetWidth;
    return Math.min(Math.max(value, min), max);
  });
  // 영역 밖까지 끌었다 놓으면 dragX는 멀리 나가 있어 제자리로 돌아오기 전에 가장자리에 잠시 멈춰 보인다.
  // motion이 손을 뗄 때 복귀 애니메이션을 시작하기 전에(capture 단계) dragX를 화면 위치로 맞춘다
  const syncDragXOnRelease = () => {
    const sync = () => {
      dragX.set(x.get());
      window.removeEventListener("pointerup", sync, true);
      window.removeEventListener("pointercancel", sync, true);
    };
    window.addEventListener("pointerup", sync, true);
    window.addEventListener("pointercancel", sync, true);
  };

  return (
    <Reorder.Item
      ref={setItemRef}
      value={link}
      custom={delay}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ layout: layoutTransition }}
      whileDrag={dragLinkAnimation}
      _dragX={dragX}
      style={{ x }}
      onPointerDownCapture={onPointerDownCapture}
      onDragStart={() => {
        syncDragXOnRelease();
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="relative"
    >
      {children}
    </Reorder.Item>
  );
};

export const BottomNavigator = () => {
  const { linkTarget } = useSettings();
  const links = useNavLinks(); // 설정 > 링크 탭에서 관리
  // 첫 화면에 있던 링크만 순서대로 등장시키고, 이후 추가된 링크는 지연 없이 바로 등장시킨다
  const [initialLinkIds] = useState(() => new Set(links.map((link) => link.id)));
  // 드래그 중에는 임시 순서로 보여주고, 손을 놓았을 때 한 번만 저장한다
  const [draggingLinks, setDraggingLinks] = useState<NavLink[] | null>(null);
  const displayedLinks = draggingLinks ?? links;
  // 드래그로 위치를 옮긴 직후에는 링크가 열리지 않도록 막는다
  const hasDraggedRef = useRef(false);
  // 링크 드래그 범위의 기준이 되는 영역
  const linkGroupRef = useRef<HTMLUListElement>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [pressedLinkId, setPressedLinkId] = useState<string | null>(null);
  const releasePress = useCallback(() => setPressedLinkId(null), []);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState(false);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const closeWidgetLibrary = useCallback(() => setIsWidgetLibraryOpen(false), []);

  return (
    <motion.div
      layout
      transition={layoutTransition}
      // 레이아웃 전환 중 크기가 바뀌어도 모서리가 찌그러지지 않도록 borderRadius는 style로 지정
      style={{ borderRadius: 20 }}
      className="flex h-[80px] w-fit items-center justify-center px-[25px] glass bg-[#C4C4C4]/40" // 설정에서 배경 색상 변경 가능하게 만들기
    >
      <section className="flex gap-3">
        {/* 빠른 링크만 순서를 바꿀 수 있고, 위젯 추가·설정 버튼은 항상 뒤에 고정된다 */}
        <Reorder.Group
          ref={linkGroupRef}
          axis="x"
          values={displayedLinks}
          onReorder={setDraggingLinks}
          className="relative flex gap-3"
        >
          <AnimatePresence mode="popLayout">
            {displayedLinks.map((link, index) => (
              <DraggableLinkItem
                key={link.id}
                link={link}
                delay={initialLinkIds.has(link.id) ? index * STAGGER_DELAY : 0}
                groupRef={linkGroupRef}
                onPointerDownCapture={() => {
                  hasDraggedRef.current = false;
                }}
                onDragStart={() => {
                  hasDraggedRef.current = true;
                  releasePress(); // 끌기 시작하면 눌림(작아짐) 상태를 풀고 드래그 모습만 보여준다
                }}
                onDragEnd={() => {
                  if (draggingLinks) navLinksStore.set(draggingLinks);
                  setDraggingLinks(null);
                }}
              >
                <a
                  href={link.href}
                  target={linkTarget}
                  rel="noopener noreferrer"
                  draggable={false} // 브라우저 기본 링크 드래그 대신 순서 변경 드래그를 사용
                  onClick={(event) => {
                    if (hasDraggedRef.current) event.preventDefault();
                  }}
                >
                  <motion.img
                    src={link.imageUrl}
                    alt={link.href}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-15 w-15 cursor-pointer rounded-[10px] object-cover"
                    animate={
                      pressedLinkId === link.id
                        ? linkIconAnimation.pressed
                        : hoveredLinkId === link.id
                          ? linkIconAnimation.hover
                          : linkIconAnimation.rest
                    }
                    transition={linkIconTransition}
                    onHoverStart={() => setHoveredLinkId(link.id)}
                    onHoverEnd={() => setHoveredLinkId((id) => (id === link.id ? null : id))}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;

                      setPressedLinkId(link.id);
                      // 아이콘 밖에서 손을 떼더라도 눌림 상태가 풀리도록 window에서 감지한다
                      window.addEventListener("pointerup", releasePress, { once: true });
                      window.addEventListener("pointercancel", releasePress, { once: true });
                    }}
                  />
                </a>
              </DraggableLinkItem>
            ))}
          </AnimatePresence>
        </Reorder.Group>
        <motion.button
          layout
          transition={layoutTransition}
          type="button"
          aria-label="위젯 추가"
          onClick={() => setIsWidgetLibraryOpen(true)}
          className="flex h-15 w-15 cursor-pointer items-center justify-center rounded-[10px] bg-[#C4C4C4]/10 transition-colors duration-300 hover:bg-[#fefefe]"
        >
          <FaPlus className="h-full w-full p-3 text-[#C4C4C4]/80" />
        </motion.button>
        <motion.button
          layout
          transition={layoutTransition}
          type="button"
          aria-label="설정 열기"
          onClick={() => setIsSettingsOpen(true)}
        >
          <PiSquaresFourFill className="h-15 w-15 cursor-pointer rounded-[10px] bg-[#C4C4C4]/10 p-3 text-[#C4C4C4]/80 hover:cursor-pointer hover:bg-[#fefefe] duration-300" />
        </motion.button>
      </section>
      <AnimatePresence>{isSettingsOpen && <Settings onClose={closeSettings} />}</AnimatePresence>
      <AnimatePresence>{isWidgetLibraryOpen && <WidgetLibrary onClose={closeWidgetLibrary} />}</AnimatePresence>
    </motion.div>
  );
};

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion } from "motion/react";
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
  // 링크 영역 밖(바 바깥이나 고정 버튼 위)으로 끌고 나가지 못하도록 드래그 범위를 제한한다
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
          className="flex gap-3"
        >
          <AnimatePresence mode="popLayout">
            {displayedLinks.map((link, index) => (
              <Reorder.Item
                key={link.id}
                value={link}
                custom={initialLinkIds.has(link.id) ? index * STAGGER_DELAY : 0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ layout: layoutTransition }}
                whileDrag={dragLinkAnimation}
                dragConstraints={linkGroupRef}
                dragElastic={0}
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
                className="relative"
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
              </Reorder.Item>
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

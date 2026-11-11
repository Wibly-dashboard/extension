import { useCallback, useState } from "react";
import { AnimatePresence, motion, stagger } from "motion/react";
import { FaPlus } from "react-icons/fa";
import { PiSquaresFourFill } from "react-icons/pi";
import { useSettings } from "../../hooks/useSettings";
import { Settings } from "./Settings";

const ICON_URL = [
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png",
  "https://assets.icon.museum/icons/f4d74646-090f-4068-9d39-553a14373389.png",
  "https://assets.icon.museum/icons/32434c98-7fd4-437e-994e-7a73155a0012.png",
  "https://assets.icon.museum/icons/9851e99f-2d59-46d4-8945-a5439897dc22.png",
  "https://assets.icon.museum/icons/334a501e-b555-42bd-a170-658c17dd5fee.jpg",
];

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 12,
    },
  },
};

const hoverLinkAnimation = {
  scale: 1.15,
  y: -10,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10,
  },
};

export const BottomNavigator = () => {
  const { linkTarget } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <motion.div
      className="flex h-[80px] w-fit items-center justify-center rounded-[20px] px-[25px] glass bg-[#C4C4C4]/40" // 설정에서 배경 색상 변경 가능하게 만들기
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: stagger(0.08),
          },
        },
      }}
    >
      <section className="flex gap-3">
        {ICON_URL.map((url, index) => (
          <a key={index} href="https://example.com" target={linkTarget} rel="noopener noreferrer">
            <motion.img
              src={url}
              alt={`Navigation ${index + 1}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-15 w-15 cursor-pointer rounded-[10px] object-cover"
              variants={itemVariants}
              whileHover={hoverLinkAnimation}
              whileTap={{
                scale: 0.9,
                y: 0,
              }}
            />
          </a>
        ))}
        <div className="h-15 w-15 cursor-pointer rounded-[10px] bg-[#C4C4C4]/10 first-letter: flex items-center justify-center hover:cursor-pointer hover:bg-[#fefefe] duration-300">
          <FaPlus className="h-full w-full p-3 text-[#C4C4C4]/80" />
        </div>
        <button type="button" aria-label="설정 열기" onClick={() => setIsSettingsOpen(true)}>
          <PiSquaresFourFill className="h-15 w-15 cursor-pointer rounded-[10px] bg-[#C4C4C4]/10 p-3 text-[#C4C4C4]/80 hover:cursor-pointer hover:bg-[#fefefe] duration-300" />
        </button>
      </section>
      <AnimatePresence>{isSettingsOpen && <Settings onClose={closeSettings} />}</AnimatePresence>
    </motion.div>
  );
};

import { motion, stagger } from "motion/react";

const ICON_URL = [
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png",
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png",
  "https://assets.icon.museum/icons/32434c98-7fd4-437e-994e-7a73155a0012.png",
  "https://assets.icon.museum/icons/9851e99f-2d59-46d4-8945-a5439897dc22.png",
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Netflix_icon.svg/3840px-Netflix_icon.svg.png",
  "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/github-white-icon.png",
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
  return (
    <motion.div
      className="flex h-[80px] w-fit items-center justify-center rounded-[20px] px-[25px] glass"
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
      <section className="flex gap-7">
        {ICON_URL.map((url, index) => (
          <motion.img
            key={index}
            src={url}
            alt={`Navigation ${index + 1}`}
            draggable={false}
            className="h-15 w-15 cursor-pointer rounded-[10px] object-cover"
            variants={itemVariants}
            whileHover={hoverLinkAnimation}
            whileTap={{
              scale: 0.9,
              y: 0,
            }}
          />
        ))}
      </section>
    </motion.div>
  );
};

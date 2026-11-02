import { motion, stagger } from "motion/react";

const ICON_URL =
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png";

export const BottomNavigator = () => {
  return (
    <motion.div
      className="flex h-[100px] w-fit items-center justify-center rounded-[20px] px-2.5 glass"
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
      <section className="flex gap-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <motion.img
            key={index}
            src={ICON_URL}
            alt={`Navigation ${index + 1}`}
            className="h-20 w-20 cursor-pointer rounded-[20px] object-cover"
            variants={{
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
                  type: "spring",
                  stiffness: 400,
                  damping: 12,
                },
              },
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </section>
    </motion.div>
  );
};

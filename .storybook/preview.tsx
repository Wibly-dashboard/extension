import type { Preview } from "@storybook/react-vite";

// @ts-expect-error Storybook/Vite handles the stylesheet import at runtime.
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    tags: ["autodocs"],

    a11y: {
      test: "todo",
    },
  },
};

export default preview;

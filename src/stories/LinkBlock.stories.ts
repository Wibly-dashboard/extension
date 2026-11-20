import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkBlock } from "../components/Footer/LinkBlock";

const meta: Meta<typeof LinkBlock> = {
  title: "Footer/LinkBlock",
  component: LinkBlock,
};

export default meta;
type Story = StoryObj<typeof LinkBlock>;

export const Default: Story = {
  args: {},
};

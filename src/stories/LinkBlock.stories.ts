import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkBlock } from "../components/Widgets/LinkBlock";

const meta: Meta<typeof LinkBlock> = {
  title: "Widgets/LinkBlock",
  component: LinkBlock,
};

export default meta;
type Story = StoryObj<typeof LinkBlock>;

export const Default: Story = {
  args: {},
};

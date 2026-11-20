import type { Meta, StoryObj } from "@storybook/react-vite";
import { FastLinkWidget } from "../components/Widgets/FastLinkWidget";

const meta: Meta<typeof FastLinkWidget> = {
  title: "Components/FastLinkWidget",
  component: FastLinkWidget,
};

export default meta;
type Story = StoryObj<typeof FastLinkWidget>;

export const Default: Story = {
  args: {
    LinkName: "Duolingo",
    LinkUrl: "https://www.duolingo.com",
    LinkImageUrl: "https://www.google.com/s2/favicons?domain=duolingo.com&sz=128",
    isShowLinkName: true,
  },
};

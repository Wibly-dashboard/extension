import type { Meta, StoryObj } from "@storybook/react-vite";
import { BottomNavigator } from "../components/Footer/BottomNavigator";

const meta: Meta<typeof BottomNavigator> = {
  title: "Components/Footer/BottomNavigator",
  component: BottomNavigator,
};

export default meta;

type Story = StoryObj<typeof BottomNavigator>;

export const Default: Story = {
  args: {},
};

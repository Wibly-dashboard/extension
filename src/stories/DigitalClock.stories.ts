import type { Meta, StoryObj } from "@storybook/react-vite";
import { DigitalClock } from "../components/Widgets/Clock/DigitalClock";

const meta: Meta<typeof DigitalClock> = {
  title: "Components/DigitalClock",
  component: DigitalClock,
};

export default meta;
type Story = StoryObj<typeof DigitalClock>;

export const Default: Story = {
  args: {},
};

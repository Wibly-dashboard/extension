export type Position = {
  x: number;
  y: number;
};

export const clampPosition = (position: Position, max: Position): Position => ({
  x: Math.min(Math.max(0, position.x), max.x),
  y: Math.min(Math.max(0, position.y), max.y),
});

export const BACKGROUND_STYLES = ["glass", "ghost", "material", "variant"] as const;

export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number];

export const DEFAULT_BACKGROUND_STYLE: BackgroundStyle = "material";

/** 편집 창에 표시할 배경 스타일 이름 */
export const BACKGROUND_STYLE_LABELS: Record<BackgroundStyle, string> = {
  glass: "glass",
  ghost: "ghost",
  material: "material",
  variant: "variant",
};

/** 저장된 값이 올바른 배경 스타일이 아니면 기본값을 사용한다 */
export const parseBackgroundStyle = (value: unknown): BackgroundStyle =>
  BACKGROUND_STYLES.includes(value as BackgroundStyle) ? (value as BackgroundStyle) : DEFAULT_BACKGROUND_STYLE;

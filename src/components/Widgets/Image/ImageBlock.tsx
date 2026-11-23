import { DEFAULT_IMAGE_SIZE } from "./imageOptions";

type ImageBlockProps = {
  imageUrl: string;
  altText: string;
  width?: number; // px
  height?: number; // px
};

export const ImageBlock: React.FC<ImageBlockProps> = ({
  imageUrl,
  altText,
  width = DEFAULT_IMAGE_SIZE,
  height = DEFAULT_IMAGE_SIZE,
}) => {
  return (
    // Tailwind는 런타임에 만든 클래스(h-${n})를 생성하지 못하므로 크기는 inline style로 지정한다
    <img
      src={imageUrl}
      alt={altText}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="pointer-events-none rounded-2xl object-cover select-none"
    />
  );
};

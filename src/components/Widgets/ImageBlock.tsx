type ImageBlockProps = {
  imageUrl: string;
  altText: string;
};

export const ImageBlock: React.FC<ImageBlockProps> = ({
  imageUrl,
  altText,
}) => {
  return (
    <img
      src={imageUrl}
      alt={altText}
      className="h-75 w-75 rounded-2xl object-cover pointer-events-none select-none"
    />
  );
};

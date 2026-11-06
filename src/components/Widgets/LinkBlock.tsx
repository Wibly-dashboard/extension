type LinkBlockProps = {
  imageUrl: string;
  /** 이동할 웹 사이트 URL */
  href: string;
};

export const LinkBlock = ({ imageUrl, href }: LinkBlockProps) => {
  return (
    <div className="flex w-fit items-center justify-center">
      <img
        src={imageUrl}
        alt="test"
        className="h-15 w-15 cursor-pointer rounded-[10px] object-cover pointer-events-none select-none"
        onClick={() => {
          if (href) {
            window.open(href, "_blank");
          }
        }}
      />
    </div>
  );
};

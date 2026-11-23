import { useSettings } from "../../hooks/useSettings";

type LinkBlockProps = {
  imageUrl: string;
  /** 이동할 웹 사이트 URL */
  href: string;
};

export const LinkBlock = ({ imageUrl, href }: LinkBlockProps) => {
  const { linkTarget } = useSettings();

  return (
    <div className="flex w-fit items-center justify-center">
      <img
        src={imageUrl}
        alt="test"
        loading="lazy"
        decoding="async"
        className="h-12 w-12 cursor-pointer rounded-[10px] object-cover pointer-events-none select-none md:h-15 md:w-15"
        onClick={() => {
          if (href) {
            window.open(href, linkTarget);
          }
        }}
      />
    </div>
  );
};

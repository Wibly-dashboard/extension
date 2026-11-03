const TestLinkImage =
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png";

export const LinkBlock = () => {
  return (
    <div className="flex h-[80px] w-fit items-center justify-center">
      <img
        src={TestLinkImage}
        alt="test"
        className="h-15 w-15 cursor-pointer rounded-[10px] object-cover pointer-events-none select-none"
      />
    </div>
  );
};

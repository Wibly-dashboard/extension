const ICON_URL =
  "https://assets.icon.museum/icons/45e50a6e-4859-4462-b41a-5f58f3aeeef5.png";

export const BottomNavigator = () => {
  return (
    <div className="flex h-[100px] w-fit items-center justify-center rounded-[20px] px-2.5 glass">
      <section className="flex gap-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <img
            key={index}
            src={ICON_URL}
            alt={`Navigation ${index + 1}`}
            className="h-20 w-20 rounded-[20px] object-cover cursor-pointer hover:scale-110 transition-transform duration-100"
          />
        ))}
      </section>
    </div>
  );
};

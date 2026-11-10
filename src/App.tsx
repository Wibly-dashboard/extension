import { useEffect } from "react";
import { BodySection } from "./components/Body/BodySection";
import { BottomNavigator } from "./components/Footer/BottomNavigator";

const value = "example";

export const App = () => {
  useEffect(() => {
    const storage = globalThis.chrome?.storage?.local;

    if (!storage) {
      return;
    }

    storage.set({ key: value }, () => {
      console.log("Value is set to " + value);
    });
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center gap-5 bg-[url('https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?auto=format&fit=crop&fm=webp&q=70&w=1600')] bg-cover bg-no-repeat px-4 pt-5 pb-5 select-none">
      <BodySection />
      <BottomNavigator />
    </main>
  );
};

export default App;

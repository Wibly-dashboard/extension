import { BottomNavigator } from "./components/Footer/BottomNavigator";
import { DigitalClock } from "./components/Header/DigitalClock";

export const App = () => {
  return (
    <main className="relative text-white flex min-h-screen flex-col items-center justify-between bg-[url('https://images.unsplash.com/photo-1654198340681-a2e0fc449f1b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D')] bg-cover bg-center bg-no-repeat px-4 pt-10 pb-7 select-none">
      <DigitalClock />
      <BottomNavigator />
    </main>
  );
};

export default App;

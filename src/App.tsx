import { BodySection } from "./components/Body/BodySection";
import { BottomNavigator } from "./components/Footer/BottomNavigator";

export const App = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center gap-5 bg-[url('https://images.unsplash.com/photo-1693786693457-75ba014bc486?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D')] bg-cover bg-no-repeat px-4 pt-5 pb-5 select-none">
      <BodySection />
      <BottomNavigator />
    </main>
  );
};

export default App;

import './App.css';
import Header from './components/Header';
import CentralCard from './components/CentralCard/CentralCard';
import Footer from './components/Footer';
import Lancamentos from './components/Lancamentos/Lancamentos';
import { Toaster } from 'react-hot-toast';
import { CalculadoraProvider } from './contexts/CalculadoraContext';

function App() {
  return (
    <CalculadoraProvider>
      <div className="flex flex-col bg-slate-100 dark:bg-[#010409] min-h-screen w-full overflow-x-hidden transition-colors duration-200">
        <Toaster position="top-right" />
        <Header />
        <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 md:pt-8 pb-6">
          <CentralCard />
          <Lancamentos />
        </div>
        <div className="w-full mt-auto">
          <Footer />
        </div>
      </div>
    </CalculadoraProvider>
  );
}
export default App;
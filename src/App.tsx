import './App.css'
import Header from './components/Header'
import CentralCard from './components/CentralCard'
import Footer from './components/Footer'
import Juros from './components/Juros'

function App() {
  return (
    <div className="flex flex-col bg-gray-200 min-h-screen w-full">

      <Header />

      <div className="flex flex-col w-full pl-[350px] pt-[15px] pb-[15px]">
        <p className="text-[14px]">
          Todos os valores estão em Reais (R$) A presente calculadora virtual não substitui o cálculo realizado e homologado judicialmente.
        </p>
      </div>

      <div className="flex-1 flex-col gap-4">
        <CentralCard />
        
        <Juros />
      </div>

      <Footer />

    </div>
  )
}

export default App
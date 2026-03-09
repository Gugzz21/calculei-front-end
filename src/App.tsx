import './App.css'
import Calcular from './components/Calcular'
import Header from './components/Header'
import Form from './components/Form'
import Data from './components/Data'
import Juros from './components/Juros'
import Footer from './components/Footer'

function App() {
  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen w-full">

      <Header />

      <div className="flex flex-col w-full pl-[350px] pt-[15px] pb-[15px]">
        <p className="text-[14px]">
          Todos os valores estão em Reais (R$) A presente calculadora virtual não substitui o cálculo realizado e homologado judicialmente.
        </p>
      </div>

      <div className="flex-1 flex-col justify-center items-center mt-10 gap-4">
        <Form />
        <Data />
        <Juros />
        <Calcular />
      </div>
      <Footer />

    </div>
  )
}

export default App
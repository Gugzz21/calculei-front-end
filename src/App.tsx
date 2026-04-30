import './App.css';
import Header from './components/Header';
import CentralCard from './components/CentralCard/CentralCard';
import Footer from './components/Footer';
import Lancamentos from './components/Lancamentos/Lancamentos';
import { useCalculadora } from './hooks/useCalculadora';
import type { FormState, JurosState, LancamentoItem } from './types';

export type { FormState, JurosState, LancamentoItem };

function App() {
  const {
    today,
    form,
    juros,
    lancamentos,
    editandoId,
    loading,
    erro,
    isFormValid,
    handleFormChange,
    handleJurosChange,
    handleCalcular,
    handleLimpar,
    handleEditar,
    handleCancelarEdicao,
    handleRemoverLancamento,
    handleLimparTodosLancamentos,
    handleConfirmarDuplicacao,
  } = useCalculadora();

  return (
    <div className="flex flex-col bg-gray-200 min-h-screen w-full overflow-x-hidden">
      <Header />
      <div className="flex flex-col gap-4 mt-12 md:mt-2 w-[95%] max-w-[1400px] mx-auto pt-12 pb-4">
        <CentralCard
          form={form}
          juros={juros}
          today={today}
          loading={loading}
          erro={erro}
          isFormValid={isFormValid}
          editandoId={editandoId}
          onFormChange={handleFormChange}
          onJurosChange={handleJurosChange}
          onCalcular={handleCalcular}
          onLimpar={handleLimpar}
          onCancelarEdicao={handleCancelarEdicao}
        />
        <div className='w-full pt-4'>
          <Lancamentos
            lancamentos={lancamentos}
            loading={loading}
            onRemover={handleRemoverLancamento}
            onEditar={handleEditar}
            onLimparTodos={handleLimparTodosLancamentos}
            onConfirmarDuplicacao={handleConfirmarDuplicacao}
          />
        </div>
      </div>
      <div className='w-full mt-auto'>
        <Footer />
      </div>
    </div>
  );
}

export default App;
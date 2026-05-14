import './App.css';
import Header from './components/Header';
import CentralCard from './components/CentralCard/CentralCard';
import Footer from './components/Footer';
import Lancamentos from './components/Lancamentos/Lancamentos';
import { useCalculadora } from './hooks/useCalculadora';
import type { FormState, JurosState, LancamentoItem } from './types';
import { Toaster } from 'react-hot-toast';

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
    <div className="flex flex-col bg-slate-100 dark:bg-[#010409] min-h-screen w-full overflow-x-hidden transition-colors duration-200">
      <Toaster position="top-right" />
      <Header />
      <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 pt-4 md:pt-8 pb-6">
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
        <Lancamentos
          lancamentos={lancamentos}
          loading={loading}
          onRemover={handleRemoverLancamento}
          onEditar={handleEditar}
          onLimparTodos={handleLimparTodosLancamentos}
          onConfirmarDuplicacao={handleConfirmarDuplicacao}
        />
      </div>
      <div className="w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}

export default App;
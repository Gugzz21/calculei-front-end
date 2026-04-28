import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import CentralCard from './components/CentralCard/CentralCard';
import Footer from './components/Footer';
import Lancamentos from './components/Lancamentos/Lancamentos';
import { calcularLancamento } from './services/calcular';
import { TIPO_CALCULO_INDICE_MAP } from './constants/dominios';
import type { FormState, JurosState, LancamentoItem } from './types';

export type { FormState, JurosState, LancamentoItem };

function App() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>({
    valor:           '',
    dataInicial:     '',
    dataCalculo:     today,
    indiceCorrecao:  'ipcae',
    tipoCalculo:     'dfazendanaotributario',
    descricao:       'ressarci',
  });

  const [juros, setJuros] = useState<JurosState>({
    enabled:    false,
    indice:     'taxalegal',
    dataInicio: '',
    dataFim:    '',
    taxa:       '12,00',
    aplicados:  [],
  });

  const [lancamentos, setLancamentos] = useState<LancamentoItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [erro, setErro]               = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };

      // Ao trocar o tipo de cálculo, pré-seleciona o índice correspondente
      if (field === 'tipoCalculo') {
        const indicePreDefinido = TIPO_CALCULO_INDICE_MAP[value];
        if (indicePreDefinido) next.indiceCorrecao = indicePreDefinido;
      }

      return next;
    });
  };

  const handleJurosChange = (field: keyof JurosState, value: string | boolean | any[]) => {
    setJuros(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'indice') {
        if (value === 'jurossimples6')                        next.taxa = '6,00';
        else if (value === 'jurossimples12' || value === 'especificartaxa') next.taxa = '12,00';
      }

      return next;
    });
  };

  const handleCalcular = async () => {
    setErro(null);
    setLoading(true);
    try {
      const minWait = new Promise(resolve => setTimeout(resolve, 500));
      const novo = await calcularLancamento(form, juros, today);
      await minWait;
      setLancamentos(prev => [...prev, novo]);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao calcular. Verifique se o servidor Java está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setForm({
      valor:           '',
      dataInicial:     '',
      dataCalculo:     today,
      indiceCorrecao:  'ipcae',
      tipoCalculo:     'dfazendanaotributario',
      descricao:       'ressarci',
    });
    setJuros({ enabled: false, indice: 'taxalegal', dataInicio: '', dataFim: '', taxa: '12,00', aplicados: [] });
    setErro(null);
  };

  const handleRemoverLancamento = (id: number) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
  };

  const handleRecuperarLancamentos = (itens: LancamentoItem[]) => {
    setLancamentos(itens);
  };

  // ── Computed ──────────────────────────────────────────────────────────────────

  const isFormValid = !!form.valor && !!form.dataInicial && !!form.dataCalculo;

  // ── Render ────────────────────────────────────────────────────────────────────

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
          onFormChange={handleFormChange}
          onJurosChange={handleJurosChange}
          onCalcular={handleCalcular}
          onLimpar={handleLimpar}
        />
        <div className='w-full pt-4'>
          <Lancamentos
            lancamentos={lancamentos}
            loading={loading}
            onRemover={handleRemoverLancamento}
            onRecuperar={handleRecuperarLancamentos}
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
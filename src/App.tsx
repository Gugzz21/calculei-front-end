import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import CentralCard from './components/CentralCard/CentralCard'
import Footer from './components/Footer'
import Lancamentos from './components/Lancamentos'
import { calcularIndice, calcularJuros, getValorAtualizado } from './services/api'

export interface LancamentoItem {
  id: number;
  descricao: string;
  dataInicial: string;
  valorPrincipal: number;
  dataCalculo: string;
  indiceCorrecao: string;
  valorAtualizado: number;
  dias: number;
  percentualCorrecao: number;
  juros: number;
  total: number;
}

export interface FormState {
  valor: string; // raw digits string
  dataInicial: string;
  dataCalculo: string;
  indiceCorrecao: string;
  tipoCalculo: string;
  descricao: string;
}

export interface JurosState {
  enabled: boolean;
  indice: string;
  dataInicio: string;
  dataFim: string;
  taxa: string; // % a.a. como string para facilitar input de decima em PT-BR
}

function App() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>({
    valor: '',
    dataInicial: '',
    dataCalculo: '',
    indiceCorrecao: 'tjrj119602009ortnotnbnttrufiripcae',
    tipoCalculo: 'dfazendanaotributario',
    descricao: 'ressarci',
  });

  const [juros, setJuros] = useState<JurosState>({
    enabled: false,
    indice: 'taxalegal',
    dataInicio: '',
    dataFim: '',
    taxa: '12,00',
  });

  const [lancamentos, setLancamentos] = useState<LancamentoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleJurosChange = (field: keyof JurosState, value: string | boolean) => {
    setJuros(prev => {
      const newState = { ...prev, [field]: value };
      
      // Quando muda o índice, define taxas padrão para os itens específicos
      if (field === 'indice') {
        if (value === 'jurossimples6') newState.taxa = '6,00';
        else if (value === 'jurossimples12' || value === 'especificartaxa') newState.taxa = '12,00';
      }
      
      return newState;
    });
  };

  const calcular = async () => {
    setErro(null);
    const valorNum = form.valor ? parseInt(form.valor, 10) / 100 : 0;

    if (!valorNum) { setErro('Informe o valor.'); return; }
    if (!form.dataInicial) { setErro('Informe a data inicial.'); return; }
    if (!form.dataCalculo) { setErro('Informe a data do cálculo.'); return; }
    if (form.dataCalculo > today) { setErro('Data do cálculo não pode ser futura.'); return; }
    if (form.dataCalculo <= form.dataInicial) { setErro('Data do cálculo deve ser posterior à data inicial.'); return; }

    setLoading(true);
    try {
      const minWait = new Promise(resolve => setTimeout(resolve, 500));
      // Correção monetária
      const respCorrecao = await calcularIndice(form.indiceCorrecao, {
        valor: valorNum,
        dateInit: form.dataInicial,
        dateFim: form.dataCalculo,
      });

      const valorAtualizado = respCorrecao ? getValorAtualizado(respCorrecao) : valorNum;
      const dias = respCorrecao?.dias ?? 0;
      const percentualCorrecao = respCorrecao?.percentualAcumulado ?? respCorrecao?.fatorAcumulado ?? 0;

      // Juros (se habilitado e SELIC não está selecionada como correção)
      let valorJuros = 0;
      const selicSelecionada = form.indiceCorrecao === 'selic' || form.indiceCorrecao === 'tjrj119602009ipcaeselic';
      if (juros.enabled && !selicSelecionada && juros.dataInicio && juros.dataFim) {
        if (juros.dataFim > juros.dataInicio) {
          const respJuros = await calcularJuros(juros.indice, {
            valor: valorAtualizado,
            dateInit: juros.dataInicio,
            dateFim: juros.dataFim,
          }, parseFloat(juros.taxa.replace(',', '.')));
          if (respJuros) {
            const valorComJuros = getValorAtualizado(respJuros);
            valorJuros = valorComJuros - valorAtualizado;
          }
        }
      }

      const total = valorAtualizado + valorJuros;

      const novo: LancamentoItem = {
        id: Date.now(),
        descricao: DESCRICAO_LABEL[form.descricao] ?? form.descricao,
        dataInicial: form.dataInicial,
        valorPrincipal: valorNum,
        dataCalculo: form.dataCalculo,
        indiceCorrecao: INDICE_LABEL[form.indiceCorrecao] ?? form.indiceCorrecao,
        valorAtualizado,
        dias,
        percentualCorrecao,
        juros: valorJuros,
        total,
      };

      await minWait;
      setLancamentos(prev => [...prev, novo]);
    } catch (e: unknown) {
      if (e instanceof Error) setErro(e.message);
      else setErro('Erro ao calcular. Verifique se o servidor Java está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setForm({
      valor: '',
      dataInicial: '',
      dataCalculo: '',
      indiceCorrecao: 'tjrj119602009ortnotnbnttrufiripcae',
      tipoCalculo: 'dfazendanaotributario',
      descricao: 'ressarci',
    });
    setJuros({ enabled: false, indice: 'taxalegal', dataInicio: '', dataFim: '', taxa: '12,00' });
    setErro(null);
  };

  // Botão Calcular só fica habilitado quando os campos obrigatórios estão preenchidos
  const isFormValid =
    !!form.valor &&
    !!form.dataInicial &&
    !!form.dataCalculo;

  const removerLancamento = (id: number) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
  };

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
          onCalcular={calcular}
          onLimpar={limpar}
        />
        <div className='w-full pt-4'>
          <Lancamentos
            lancamentos={lancamentos}
            loading={loading}
            onRemover={removerLancamento}
          />
        </div>
      </div>
      <div className='w-full mt-auto'>
        <Footer />
      </div>
    </div>
  );
}

const INDICE_LABEL: Record<string, string> = {
  ipca: 'IPCA',
  ipcae: 'IPCA-E',
  igpm: 'IGP-M',
  tr: 'TR',
  inpc: 'INPC',
  igpdi: 'IGP-DI',
  ipcbr: 'IPC-BR',
  cdi: 'CDI',
  selic: 'SELIC',
  semcorrecaomonetaria: 'Sem Correção',
  tjrj119602009ortnotnbnttrufiripcae: 'TJRJ 11.960/09',
  tjrj119602009ipcaeselic: 'TJRJ IPCA/SELIC',
};

const DESCRICAO_LABEL: Record<string, string> = {
  ressarci: 'Ressarcimento',
  ressarcimentoaoetario: 'Ressarc. ao Etário',
  debitosdfp: 'Débitos da Fazenda',
  multacivil: 'Multa Civil',
  honorariosadvocaticios: 'Honorários Adv.',
  outros: 'Outros',
};

export default App
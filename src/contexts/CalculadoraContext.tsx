import React, { createContext, useContext, useState, useRef } from 'react';
import type { FormState, JurosState, LancamentoItem } from '../types';
import { CalculoService } from '../services/CalculoService';
import { ReplicacaoService } from '../services/ReplicacaoService';
import { buscarUfirValue } from '../services/api';
import { TIPO_CALCULO_INDICE_MAP } from '../constants/dominios';
import toast from 'react-hot-toast';

interface CalculadoraContextData {
  today: string;
  form: FormState;
  juros: JurosState;
  lancamentos: LancamentoItem[];
  editandoId: number | null;
  loading: boolean;
  erro: string | null;
  isFormValid: boolean;
  ufirValue: number;
  
  handleFormChange: (field: keyof FormState, value: string) => void;
  handleJurosChange: (field: keyof JurosState, value: string | boolean | any[]) => void;
  handleCalcular: () => Promise<void>;
  handleLimpar: () => void;
  handleEditar: (id: number) => void;
  handleCancelarEdicao: () => void;
  handleRemoverLancamento: (id: number) => void;
  handleLimparTodosLancamentos: () => void;
  handleConfirmarDuplicacao: (idBase: number, novasDatas: string[]) => Promise<void>;
}

const CalculadoraContext = createContext<CalculadoraContextData>({} as CalculadoraContextData);

export const CalculadoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = new Date().toISOString().split('T')[0];

  // Estados principais
  const [form, setForm] = useState<FormState>({
    valor: '',
    dataInicial: '',
    dataCalculo: today,
    indiceCorrecao: '',
    tipoCalculo: '',
    descricao: '',
  });

  const [juros, setJuros] = useState<JurosState>({
    enabled: false,
    indice: 'taxalegal',
    dataInicio: '',
    dataFim: '',
    taxa: '12,00',
    aplicados: [],
  });

  const [lancamentos, setLancamentos] = useState<LancamentoItem[]>([]);
  const [lancamentosOrigem, setLancamentosOrigem] = useState<Record<number, { form: FormState; juros: JurosState }>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ufirValue, setUfirValue] = useState<number>(0);

  const calculandoRef = useRef(false);

  // Buscar UFIR ao carregar
  React.useEffect(() => {
    buscarUfirValue().then(setUfirValue);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
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
        if (value === 'jurossimples6') next.taxa = '6,00';
        else if (value === 'jurossimples12' || value === 'especificartaxa') next.taxa = '12,00';
      }
      return next;
    });
  };

  const handleCalcular = async () => {
    if (calculandoRef.current) return;
    calculandoRef.current = true;

    setErro(null);
    setLoading(true);
    try {
      const resultado = await CalculoService.calcular(form, juros, today);

      if (editandoId !== null) {
        setLancamentos(prev => prev.map(l => l.id === editandoId ? { ...resultado, id: editandoId } : l));
        setLancamentosOrigem(prev => ({ ...prev, [editandoId]: { form: { ...form }, juros: { ...juros } } }));
        setEditandoId(null);
        toast.success("Lançamento atualizado!");
      } else {
        setLancamentos(prev => [...prev, resultado]);
        setLancamentosOrigem(prev => ({ ...prev, [resultado.id]: { form: { ...form }, juros: { ...juros } } }));
        toast.success("Lançamento adicionado!");
      }

      if (juros.enabled && juros.aplicados.length > 0) {
        setJuros(prev => ({ ...prev, aplicados: [] }));
      }
    } catch (e: any) {
      setErro(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
      calculandoRef.current = false;
    }
  };

  const handleLimpar = () => {
    setForm({
      valor: '',
      dataInicial: '',
      dataCalculo: today,
      indiceCorrecao: '',
      tipoCalculo: '',
      descricao: '',
    });
    setJuros({ enabled: false, indice: 'taxalegal', dataInicio: '', dataFim: '', taxa: '12,00', aplicados: [] });
    setEditandoId(null);
    setErro(null);
  };

  const handleEditar = (id: number) => {
    const origem = lancamentosOrigem[id];
    if (!origem) return;
    setForm({ ...origem.form });
    setJuros({ ...origem.juros });
    setEditandoId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setErro(null);
  };

  const handleRemoverLancamento = (id: number) => {
    if (window.confirm("Remover este lançamento?")) {
      setLancamentos(prev => prev.filter(l => l.id !== id));
      toast.success("Removido");
    }
  };

  const handleLimparTodosLancamentos = () => {
    if (window.confirm("Remover todos os lançamentos?")) {
      setLancamentos([]);
      setLancamentosOrigem({});
      setEditandoId(null);
    }
  };

  const handleConfirmarDuplicacao = async (idBase: number, novasDatas: string[]) => {
    const origem = lancamentosOrigem[idBase];
    if (!origem) return;

    setLoading(true);
    try {
      const { resultados, origemMap } = await ReplicacaoService.replicar(origem, novasDatas, today);
      setLancamentos(prev => [...prev, ...resultados]);
      setLancamentosOrigem(prev => ({ ...prev, ...origemMap }));
      toast.success("Parcelas duplicadas!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !!form.valor && !!form.dataInicial && !!form.dataCalculo && !!form.tipoCalculo && !!form.indiceCorrecao && !!form.descricao;

  return (
    <CalculadoraContext.Provider value={{
      today, form, juros, lancamentos, editandoId, loading, erro, isFormValid, ufirValue,
      handleFormChange, handleJurosChange, handleCalcular, handleLimpar,
      handleEditar, handleCancelarEdicao, handleRemoverLancamento,
      handleLimparTodosLancamentos, handleConfirmarDuplicacao
    }}>
      {children}
    </CalculadoraContext.Provider>
  );
};

export const useCalculadoraContext = () => useContext(CalculadoraContext);

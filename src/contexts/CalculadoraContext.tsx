import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import type { FormState, JurosState, LancamentoItem } from '../types';
import { CalculoService } from '../services/CalculoService';
import { ReplicacaoService } from '../services/ReplicacaoService';
import { buscarUfirValue, prefetchIndice } from '../services/api';
import { TIPO_CALCULO_INDICE_MAP } from '../constants/dominios';
import { useAutoRecovery } from '../hooks/useAutoRecovery';
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
    descricaoComplementar: '',
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

  // ── Recuperação automática por token na URL (?token=...)
  useAutoRecovery(setLancamentos, setLoading, setErro, setLancamentosOrigem);

  // Buscar UFIR ao carregar
  React.useEffect(() => {
    buscarUfirValue().then(setUfirValue);
  }, []);

  // Pré-busca do índice em background quando o usuário preenche os campos
  // para que o cálculo final seja instantâneo
  React.useEffect(() => {
    if (form.indiceCorrecao && form.dataInicial && form.dataCalculo) {
      prefetchIndice(form.indiceCorrecao, {
        valor: 1, // valor dummy para pré-busca (fator de correção independe do valor principal)
        dateInit: form.dataInicial,
        dateFim: form.dataCalculo,
      });
    }
  }, [form.indiceCorrecao, form.dataInicial, form.dataCalculo]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFormChange = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'tipoCalculo') {
        const indicePreDefinido = TIPO_CALCULO_INDICE_MAP[value];
        if (indicePreDefinido) next.indiceCorrecao = indicePreDefinido;
      }
      return next;
    });
  }, []);

  const handleJurosChange = useCallback((field: keyof JurosState, value: string | boolean | any[]) => {
    setJuros(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'indice') {
        if (value === 'jurossimples6') next.taxa = '6,00';
        else if (value === 'jurossimples12' || value === 'especificartaxa') next.taxa = '12,00';
      }
      return next;
    });
  }, []);

  const handleCalcular = useCallback(async () => {
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
  }, [form, juros, editandoId, today]);

  const handleLimpar = useCallback(() => {
    setForm({
      valor: '',
      dataInicial: '',
      dataCalculo: today,
      indiceCorrecao: '',
      tipoCalculo: '',
      descricao: '',
      descricaoComplementar: '',
    });
    setJuros({ enabled: false, indice: 'taxalegal', dataInicio: '', dataFim: '', taxa: '12,00', aplicados: [] });
    setEditandoId(null);
    setErro(null);
  }, [today]);

  const handleEditar = useCallback((id: number) => {
    const origem = lancamentosOrigem[id];
    if (!origem) return;
    setForm({ ...origem.form });
    setJuros({ ...origem.juros });
    setEditandoId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lancamentosOrigem]);

  const handleCancelarEdicao = useCallback(() => {
    setEditandoId(null);
    setErro(null);
  }, []);

  const handleRemoverLancamento = useCallback((id: number) => {
    setLancamentos(prev => prev.filter(l => l.id !== id));
    toast.success("Lançamento removido");
  }, []);

  const handleLimparTodosLancamentos = useCallback(() => {
    setLancamentos([]);
    setLancamentosOrigem({});
    setEditandoId(null);
    toast.success("Lançamentos removidos");
  }, []);

  const handleConfirmarDuplicacao = useCallback(async (idBase: number, novasDatas: string[]) => {
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
  }, [lancamentosOrigem, today]);

  const isFormValid = useMemo(
    () => !!form.valor && !!form.dataInicial && !!form.dataCalculo && !!form.tipoCalculo && !!form.indiceCorrecao && !!form.descricao,
    [form.valor, form.dataInicial, form.dataCalculo, form.tipoCalculo, form.indiceCorrecao, form.descricao]
  );

  /*
   * ── Ordenação por data inicial (mais antigo primeiro) ─────────────────────
   *
   * Por que aqui no contexto e não na tabela/exportações individualmente?
   *   Centralizar garante consistência: tabela, PDF e Excel sempre recebem
   *   exatamente o mesmo array ordenado, sem duplicar a lógica nos 3 lugares.
   *
   * Por que localeCompare e não new Date().getTime()?
   *   As datas estão no formato ISO "YYYY-MM-DD" — a comparação lexicográfica
   *   de strings nesse formato é equivalente à comparação cronológica.
   *   localeCompare é mais rápido que criar objetos Date para cada comparação.
   *
   * Por que useMemo e não reordenar no setLancamentos?
   *   O array bruto `lancamentos` mantém a ordem de inserção (necessária para
   *   edição/remoção por id). A ordenação é uma visão derivada — separar
   *   estado de apresentação é a abordagem correta em React.
   */
  const lancamentosOrdenados = useMemo(
    () => [...lancamentos].sort((a, b) => a.dataInicial.localeCompare(b.dataInicial)),
    [lancamentos]
  );

  // Memoizar o value do Provider: sem isso, um novo objeto é criado a cada render
  // forçando TODOS os consumidores do contexto a re-renderizar desnecessariamente.
  const contextValue = useMemo(() => ({
    today, form, juros, lancamentos: lancamentosOrdenados, editandoId, loading, erro, isFormValid, ufirValue,
    handleFormChange, handleJurosChange, handleCalcular, handleLimpar,
    handleEditar, handleCancelarEdicao, handleRemoverLancamento,
    handleLimparTodosLancamentos, handleConfirmarDuplicacao
  }), [
    today, form, juros, lancamentosOrdenados, editandoId, loading, erro, isFormValid, ufirValue,
    handleFormChange, handleJurosChange, handleCalcular, handleLimpar,
    handleEditar, handleCancelarEdicao, handleRemoverLancamento,
    handleLimparTodosLancamentos, handleConfirmarDuplicacao
  ]);

  return (
    <CalculadoraContext.Provider value={contextValue}>
      {children}
    </CalculadoraContext.Provider>
  );
};

export const useCalculadoraContext = () => useContext(CalculadoraContext);

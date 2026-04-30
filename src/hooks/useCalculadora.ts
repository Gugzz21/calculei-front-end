import { useState} from 'react';
import { calcularLancamento } from '../services/calcular';
import { TIPO_CALCULO_INDICE_MAP } from '../constants/dominios';
import type { FormState, JurosState, LancamentoItem } from '../types';
import { useAutoRecovery } from './useAutoRecovery';

export function useCalculadora() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>({
    valor: '',
    dataInicial: '',
    dataCalculo: today,
    indiceCorrecao: 'ipcae',
    tipoCalculo: 'dfazendanaotributario',
    descricao: 'ressarci',
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

  // ── Auto Recovery via Link ────────────────────────────────────────────────────
  useAutoRecovery(setLancamentos, setLoading, setErro);

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
    setErro(null);
    setLoading(true);
    try {
      const minWait = new Promise(resolve => setTimeout(resolve, 500));
      const resultado = await calcularLancamento(form, juros, today);
      await minWait;

      if (editandoId !== null) {
        // Modo edição
        setLancamentos(prev =>
          prev.map(l => l.id === editandoId ? { ...resultado, id: editandoId } : l)
        );
        setLancamentosOrigem(prev => ({
          ...prev,
          [editandoId]: { form: { ...form }, juros: { ...juros } },
        }));
        setEditandoId(null);
      } else {
        // Modo adição
        setLancamentos(prev => [...prev, resultado]);
        setLancamentosOrigem(prev => ({
          ...prev,
          [resultado.id]: { form: { ...form }, juros: { ...juros } },
        }));
      }

      if (juros.enabled && juros.aplicados.length > 0) {
        setJuros(prev => ({ ...prev, aplicados: [] }));
      }

    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao calcular. Verifique se o servidor Java está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setForm({
      valor: '',
      dataInicial: '',
      dataCalculo: today,
      indiceCorrecao: 'ipcae',
      tipoCalculo: 'dfazendanaotributario',
      descricao: 'ressarci',
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
    if (window.confirm("Tem certeza que deseja remover este lançamento?")) {
      setLancamentos(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleLimparTodosLancamentos = () => {
    if (window.confirm("Tem certeza que deseja remover todos os lançamentos?")) {
      setLancamentos([]);
      setLancamentosOrigem({});
      setEditandoId(null);
    }
  };

  const handleConfirmarDuplicacao = async (idBase: number, novasDatas: string[]) => {
    const origem = lancamentosOrigem[idBase];
    if (!origem) return;

    setLoading(true);
    setErro(null);

    const novosResultados: LancamentoItem[] = [];
    const novoOrigemMap: Record<number, { form: FormState; juros: JurosState }> = {};

    try {
      for (let i = 0; i < novasDatas.length; i++) {
        const formParaCalcular = { ...origem.form, dataInicial: novasDatas[i] };
        
        const minWait = new Promise(resolve => setTimeout(resolve, 100));
        const resultado = await calcularLancamento(formParaCalcular, origem.juros, today);
        await minWait;

        const novoId = Date.now() + i + Math.floor(Math.random() * 1000);
        const itemComIdUnico = { ...resultado, id: novoId };
        
        novosResultados.push(itemComIdUnico);
        novoOrigemMap[novoId] = { form: { ...formParaCalcular }, juros: { ...origem.juros } };
      }

      setLancamentos(prev => [...prev, ...novosResultados]);
      setLancamentosOrigem(prev => ({ ...prev, ...novoOrigemMap }));

    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao duplicar parcelas.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !!form.valor && !!form.dataInicial && !!form.dataCalculo;

  return {
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
    handleConfirmarDuplicacao
  };
}

import { useState, useRef, useEffect } from 'react';
import { calcularLancamento } from '../services/calcular';
import { TIPO_CALCULO_INDICE_MAP } from '../constants/dominios';
import type { FormState, JurosState, LancamentoItem } from '../types';
import { useAutoRecovery } from './useAutoRecovery';
import toast from 'react-hot-toast';

export function useCalculadora() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormState>(() => {
    const saved = localStorage.getItem('calculei_form');
    if (saved) return JSON.parse(saved);
    return {
      valor: '',
      dataInicial: '',
      dataCalculo: today,
      indiceCorrecao: 'ipcae',
      tipoCalculo: 'dfazendanaotributario',
      descricao: 'ressarci',
    };
  });

  const [juros, setJuros] = useState<JurosState>(() => {
    const saved = localStorage.getItem('calculei_juros');
    if (saved) return JSON.parse(saved);
    return {
      enabled: false,
      indice: 'taxalegal',
      dataInicio: '',
      dataFim: '',
      taxa: '12,00',
      aplicados: [],
    };
  });

  const [lancamentos, setLancamentos] = useState<LancamentoItem[]>(() => {
    const saved = localStorage.getItem('calculei_lancamentos');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [lancamentosOrigem, setLancamentosOrigem] = useState<Record<number, { form: FormState; juros: JurosState }>>(() => {
    const saved = localStorage.getItem('calculei_lancamentosOrigem');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Proteção contra duplo clique: useRef é síncrono, ao contrário do estado React
  const calculandoRef = useRef(false);

  // ── Auto Recovery via Link ────────────────────────────────────────────────────
  useAutoRecovery(setLancamentos, setLoading, setErro);

  // ── Persistência Local ────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('calculei_form', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem('calculei_juros', JSON.stringify(juros));
  }, [juros]);

  useEffect(() => {
    localStorage.setItem('calculei_lancamentos', JSON.stringify(lancamentos));
  }, [lancamentos]);

  useEffect(() => {
    localStorage.setItem('calculei_lancamentosOrigem', JSON.stringify(lancamentosOrigem));
  }, [lancamentosOrigem]);

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
    // Proteção síncrona contra duplo clique (setLoading é assíncrono e chegaria tarde)
    if (calculandoRef.current) return;
    calculandoRef.current = true;

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
        toast.success("Lançamento atualizado com sucesso!");
      } else {
        // Modo adição
        setLancamentos(prev => [...prev, resultado]);
        setLancamentosOrigem(prev => ({
          ...prev,
          [resultado.id]: { form: { ...form }, juros: { ...juros } },
        }));
        toast.success("Lançamento adicionado com sucesso!");
      }

      if (juros.enabled && juros.aplicados.length > 0) {
        setJuros(prev => ({ ...prev, aplicados: [] }));
      }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao calcular. Verifique se o servidor Java está rodando.';
      setErro(msg);
      toast.error(msg);
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
      toast.success("Lançamento removido");
    }
  };

  const handleLimparTodosLancamentos = () => {
    if (window.confirm("Tem certeza que deseja remover todos os lançamentos?")) {
      setLancamentos([]);
      setLancamentosOrigem({});
      setEditandoId(null);
      toast.success("Todos os lançamentos foram removidos");
    }
  };

  const handleConfirmarDuplicacao = async (idBase: number, novasDatas: string[]) => {
    const origem = lancamentosOrigem[idBase];
    if (!origem) return;

    setLoading(true);
    setErro(null);

    try {
      // Tamanho do lote de requisições paralelas
      // Evita sobrecarregar o backend com 100 chamadas simultâneas
      const LOTE = 5;

      const novosResultados: LancamentoItem[] = [];
      const novoOrigemMap: Record<number, { form: FormState; juros: JurosState }> = {};

      for (let inicio = 0; inicio < novasDatas.length; inicio += LOTE) {
        const lote = novasDatas.slice(inicio, inicio + LOTE);

        // Processa o lote em paralelo
        const resultadosLote = await Promise.all(
          lote.map((data, indexNoLote) => {
            const formParaCalcular = { ...origem.form, dataInicial: data };
            return calcularLancamento(formParaCalcular, origem.juros, today).then(resultado => ({
              resultado,
              formParaCalcular,
              indiceGlobal: inicio + indexNoLote,
            }));
          })
        );

        for (const { resultado, formParaCalcular, indiceGlobal } of resultadosLote) {
          const novoId = Date.now() + indiceGlobal + Math.floor(Math.random() * 1000);
          novosResultados.push({ ...resultado, id: novoId });
          novoOrigemMap[novoId] = { form: { ...formParaCalcular }, juros: { ...origem.juros } };
        }
      }

      setLancamentos(prev => [...prev, ...novosResultados]);
      setLancamentosOrigem(prev => ({ ...prev, ...novoOrigemMap }));
      toast.success("Parcelas duplicadas com sucesso!");

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao duplicar parcelas.';
      setErro(msg);
      toast.error(msg);
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

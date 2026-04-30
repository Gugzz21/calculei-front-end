import { useState, useEffect, useRef } from 'react';
import { calcularLancamento } from '../services/calcular';
import { TIPO_CALCULO_INDICE_MAP } from '../constants/dominios';
import { buscarPorToken } from '../services/api';
import { extrairLancamentos, converterParaLancamentoItem } from '../components/Lancamentos/utils/utils';
import type { FormState, JurosState, LancamentoItem } from '../types';

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
  const hasRecovered = useRef(false);

  useEffect(() => {
    if (hasRecovered.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParams = searchParams.get('token');
    if (tokenParams) {
      hasRecovered.current = true;
      setLoading(true);
      buscarPorToken(tokenParams)
        .then((resultado: any) => {
          const recuperados = extrairLancamentos(resultado);
          if (recuperados && recuperados.length > 0) {
            setLancamentos(converterParaLancamentoItem(recuperados));
            alert("Lançamentos recuperados com sucesso!");
          } else {
            setErro("Lançamentos não encontrados para este link.");
          }
        })
        .catch((e) => {
          setErro("Erro ao recuperar dados do link: " + e.message);
        })
        .finally(() => {
          setLoading(false);
          // Opcional: remover o parâmetro da URL para não recarregar no refresh
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

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
        // ── Modo edição: substitui o lançamento existente mantendo o mesmo id ──
        setLancamentos(prev =>
          prev.map(l => l.id === editandoId ? { ...resultado, id: editandoId } : l)
        );
        setLancamentosOrigem(prev => ({
          ...prev,
          [editandoId]: { form: { ...form }, juros: { ...juros } },
        }));
        setEditandoId(null);
      } else {
        // ── Modo adição: acrescenta à lista ──
        setLancamentos(prev => [...prev, resultado]);
        setLancamentosOrigem(prev => ({
          ...prev,
          [resultado.id]: { form: { ...form }, juros: { ...juros } },
        }));
      }

      // Limpa a tabela de juros (se houver) para o próximo cálculo
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
    // Rola suavemente até o topo para o usuário ver o formulário
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
    handleLimparTodosLancamentos
  };
}

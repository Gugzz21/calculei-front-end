import { useEffect, useRef } from 'react';
import { buscarPorToken } from '../services/api';
import { extrairLancamentos, converterParaLancamentoItem } from '../utils/helpers';
import type { LancamentoItem, DadosRecuperados, FormState, JurosState } from '../types';
import toast from 'react-hot-toast';

export function useAutoRecovery(
  setLancamentos: React.Dispatch<React.SetStateAction<LancamentoItem[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setErro: React.Dispatch<React.SetStateAction<string | null>>,
  setLancamentosOrigem: React.Dispatch<React.SetStateAction<Record<number, { form: FormState; juros: JurosState }>>>
) {
  const hasRecovered = useRef(false);

  useEffect(() => {
    if (hasRecovered.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const tokenParams = searchParams.get('token');

    if (!tokenParams) return;

    hasRecovered.current = true;
    setLoading(true);

    const toastId = toast.loading('Recuperando lançamentos pelo link...');

    buscarPorToken(tokenParams)
      .then((resultado: DadosRecuperados) => {
        const recuperados = extrairLancamentos(resultado);
        if (recuperados && recuperados.length > 0) {
          const convertidos = converterParaLancamentoItem(recuperados);
          setLancamentos(convertidos);
          
          const origens: Record<number, { form: FormState; juros: JurosState }> = {};
          convertidos.forEach(l => {
             const form: FormState = {
                valor: (l.valorPrincipal * 100).toFixed(0),
                dataInicial: l.dataInicial,
                dataCalculo: l.dataCalculo,
                indiceCorrecao: l.indiceCorrecao,
                tipoCalculo: l.tipoCalculo || '',
                descricao: l.descricao || '',
                descricaoComplementar: l.descricaoComplementar || '',
             };
             
             let enabled = false;
             let jurosAplicados: any[] = [];
             
             if (l.itensJuros && l.itensJuros.length > 0) {
                enabled = true;
                jurosAplicados = [...l.itensJuros];
             } else if (l.indiceJuros && l.indiceJuros !== '—') {
                enabled = true;
                jurosAplicados = [{
                   indice: l.indiceJuros,
                   dataInicio: l.dataInicioJuros,
                   dataFim: l.dataFimJuros,
                   dias: l.diasJuros,
                   taxa: l.fatorJuros || '12,00',
                   percentual: l.percentualJurosAcumulado,
                   valor: l.juros
                }];
             }
             
             const juros: JurosState = {
                enabled,
                indice: 'taxalegal', // default
                dataInicio: '',
                dataFim: '',
                taxa: '12,00',
                aplicados: jurosAplicados
             };
             
             origens[l.id] = { form, juros };
          });
          setLancamentosOrigem(prev => ({ ...prev, ...origens }));

          toast.success(
            `${recuperados.length} lançamento${recuperados.length > 1 ? 's' : ''} recuperado${recuperados.length > 1 ? 's' : ''} com sucesso!`,
            { id: toastId, duration: 4000 }
          );
        } else {
          toast.error('Nenhum lançamento encontrado para este link.', { id: toastId });
          setErro('Lançamentos não encontrados para este link.');
        }
      })
      .catch((e: Error) => {
        toast.error('Erro ao recuperar: ' + e.message, { id: toastId, duration: 5000 });
        setErro('Erro ao recuperar dados do link: ' + e.message);
      })
      .finally(() => {
        setLoading(false);
        // Remove o token da URL para não recarregar no refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      });
  }, [setLancamentos, setLoading, setErro, setLancamentosOrigem]);
}

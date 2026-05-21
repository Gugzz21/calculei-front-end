import { useEffect, useRef } from 'react';
import { buscarPorToken } from '../services/api';
import { extrairLancamentos, converterParaLancamentoItem } from '../utils/helpers';
import type { LancamentoItem } from '../types';
import toast from 'react-hot-toast';

export function useAutoRecovery(
  setLancamentos: React.Dispatch<React.SetStateAction<LancamentoItem[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setErro: React.Dispatch<React.SetStateAction<string | null>>
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
      .then((resultado: any) => {
        const recuperados = extrairLancamentos(resultado);
        if (recuperados && recuperados.length > 0) {
          setLancamentos(converterParaLancamentoItem(recuperados));
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
  }, [setLancamentos, setLoading, setErro]);
}

import { useEffect, useRef } from 'react';
import { buscarPorToken } from '../services/api';
import { extrairLancamentos, converterParaLancamentoItem } from '../utils/helpers';
import type { LancamentoItem } from '../types';

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
          // Remove o parâmetro da URL para não recarregar no refresh
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [setLancamentos, setLoading, setErro]);
}

import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';
import { useCalculadoraContext } from '../contexts/CalculadoraContext';

const STEPS: Step[] = [
  {
    target: '#tabela-lancamentos',
    placement: 'top',
    title: 'Tabela de Resultados',
    content: 'Aqui estão os lançamentos calculados. A tabela já está ordenada pela data inicial do cálculo para facilitar a leitura.',
    skipBeacon: true,
  },
  {
    target: '.linha-lancamento',
    placement: 'bottom',
    title: 'Detalhes do Lançamento',
    content: 'Clique em qualquer linha para expandir e ver os detalhes. Se você aplicou juros, a memória de cálculo dos juros aparecerá aqui!',
  },
  {
    target: '.acoes-lancamento',
    placement: 'left',
    title: 'Ações Rápidas',
    content: 'Você pode editar (✏️), duplicar (📋) ou remover (🗑️) um lançamento facilmente usando estes botões.',
  },
  {
    target: '#botoes-exportacao',
    placement: 'top',
    title: 'Exportar e Salvar',
    content: 'Você pode gerar um PDF completo, exportar para Excel ou salvar como imagem. O link de recuperação será gerado automaticamente após a exportação!',
  }
];

export default function TourPosCalculo() {
  const [run, setRun] = useState(false);
  const { lancamentos } = useCalculadoraContext();

  useEffect(() => {
    // Só inicia o tour se houver lançamentos E se o usuário ainda não tiver visto
    if (lancamentos.length > 0) {
      const hasSeen = localStorage.getItem('hasSeenTourPosCalculo');
      if (!hasSeen) {
        // Pequeno delay para dar tempo da tabela renderizar suavemente
        setTimeout(() => setRun(true), 500);
      }
    }
  }, [lancamentos.length]);

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;
    const isFinishedOrSkipped = ([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status);
    const isClosed = action === 'close';

    if (isFinishedOrSkipped || isClosed) {
      localStorage.setItem('hasSeenTourPosCalculo', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous={true}
      onEvent={handleJoyrideCallback}
      options={{
        primaryColor: '#6d28d9', // violet-700
        zIndex: 10000,
        showProgress: true,
        arrowColor: '#ffffff',
        backgroundColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        textColor: '#333333',
      }}
      styles={{
        buttonPrimary: {
          backgroundColor: '#6d28d9',
          borderRadius: 8,
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#64748b',
          fontSize: 14,
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1e293b',
          textAlign: 'left',
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          color: '#475569',
          textAlign: 'left',
        }
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        nextWithProgress: 'Próximo ({current} de {total})',
        skip: 'Pular',
      }}
    />
  );
}

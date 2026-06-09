import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';
import { useCalculadoraContext } from '../contexts/CalculadoraContext';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo ao Calculei!',
    content: 'Fizemos várias melhorias na interface! Agora você tem exportação para Excel, resultados mais claros e os lançamentos estão mais organizados. Vamos fazer um rápido tour para você conhecer as novidades?',
  },
  {
    target: '#tour-inclusao',
    title: 'Nova área de inclusão de dados',
    content: 'Nova área reformulada com uma nova ordenação e novo visual dos campos e botões.',
  },
  {
    target: '#tour-tabela',
    title: 'Nova tabela e funcionalidades',
    content: 'A nova tabela possui mais espaço e está agrupada diferente, priorizando algumas colunas. Além de termos a nova função Printar e salvar.',
  },
];

export default function OnboardingTour() {
  const [run, setRun] = useState(false);
  const { lancamentos } = useCalculadoraContext();

  useEffect(() => {
    // Só inicia o tour se ainda não foi visto
    const hasSeen = localStorage.getItem('hasSeenJoyrideTour');
    if (!hasSeen) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;
    const isFinishedOrSkipped = ([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status);
    const isClosed = action === 'close';
    
    if (isFinishedOrSkipped || isClosed) {
      // Salva no localStorage para não mostrar novamente
      localStorage.setItem('hasSeenJoyrideTour', 'true');
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
        primaryColor: '#003b73',
        zIndex: 10000,
        showProgress: true,
      }}
      styles={{
        buttonPrimary: {
          backgroundColor: '#003b73',
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
        },
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

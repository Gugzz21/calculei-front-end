import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';
import { useCalculadoraContext } from '../contexts/CalculadoraContext';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo à nova versão do Calculei! 🎉',
    content: 'Fizemos várias melhorias na interface! Agora você tem exportação para Excel, resultados mais claros e os lançamentos estão mais organizados. Vamos fazer um rápido tour para você conhecer as novidades?',
  },
  {
    target: '#tour-tipo-calculo',
    title: 'Defina a natureza do débito',
    content: 'Escolha se é um cálculo comum ou contra a Fazenda Pública. Para iniciar, deixaremos no padrão "Comum".',
  },
  {
    target: '#tour-valor-principal',
    title: 'Qual o valor a ser corrigido?',
    content: 'Digite o valor histórico original que você deseja atualizar. Ex: R$ 1.000,00',
  },
  {
    target: '#tour-datas',
    title: 'Defina o período',
    content: 'Insira a data inicial do débito e a data até a qual deseja calcular a correção.',
  },
  {
    target: '#tour-indice-juros',
    title: 'Regras simplificadas',
    content: 'Todo o visual de índices e juros foi simplificado. As opções padrão já vêm configuradas, e se precisar editar, os painéis estão mais fáceis de ler.',
  },
  {
    target: '#tour-btn-calcular',
    title: 'Mais resultados, nova exportação!',
    content: 'Clique em Calcular para gerar o lançamento. A tabela de lançamentos logo abaixo agora permite expandir os detalhes e exportar para Excel, além do PDF e imagem!',
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
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}

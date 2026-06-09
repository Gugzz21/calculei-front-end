import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'tipoCalculo' | 'indiceCorrecao' | 'jurosIndice';
  selectedValue?: string;
}

export default function InfoModal({ isOpen, onClose, context, selectedValue }: InfoModalProps) {
  // Configuração das abas por contexto
  const configs = {
    tipoCalculo: {
      title: 'Sobre Tipo de Cálculo',
      tabs: [
        {
          id: 'cdparticular',
          label: 'Entre particulares',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Créditos / Débitos Entre Particulares</p>
              <p className="leading-relaxed">
                Utilizado para atualizações de obrigações civis comuns entre pessoas físicas ou jurídicas de direito privado.
                Exemplos comuns incluem contratos de prestação de serviços, aluguéis comerciais e residenciais, pensões alimentícias, condomínios ou empréstimos pessoais.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r text-xs">
                <strong>Critério de correção:</strong> Geralmente utiliza a variação da UFIR-RJ (TJ/RJ Lei 6.899/81) ou o IGP-M, com juros moratórios com base no Código Civil.
              </div>
            </div>
          )
        },
        {
          id: 'cfazenda',
          label: 'CRÉD. FAZENDA',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Créditos da Fazenda Pública</p>
              <p className="leading-relaxed">
                Aplica-se a valores ativos que o poder público (União, Estados, Municípios ou autarquias) tem a receber de particulares ou empresas (ex: ressarcimentos ao erário, multas contratuais, cobranças administrativas).
              </p>
            </div>
          )
        },
        {
          id: 'dfazendatributario',
          label: 'FAZ. TRIBUTÁRIO',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Débitos da Fazenda Pública - Tributários</p>
              <p className="leading-relaxed">
                Condenações impostas ao poder público decorrentes de repetição de indébito tributário (devolução de impostos ou taxas pagos indevidamente pelo contribuinte).
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r text-xs">
                <strong>Importante (Emenda Constitucional 113/2021):</strong> A atualização monetária e a incidência de juros ocorrem exclusivamente pela taxa SELIC acumulada, sendo vedada a cumulação com qualquer outro índice.
              </div>
            </div>
          )
        },
        {
          id: 'dfazendanaotributario',
          label: 'Faz. não tributário',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Débitos da Fazenda Pública - Não Tributários</p>
              <p className="leading-relaxed">
                Condenações contra o poder público de natureza não tributária, tais como indenizações civis, desapropriações judiciais, pensões por ato ilícito e cobranças de servidores ou fornecedores.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r text-xs">
                <strong>Critério:</strong> Atualização monetária pelo IPCA-E acrescida de juros moratórios com base no rendimento oficial da caderneta de poupança (conforme a Lei 11.960/09).
              </div>
            </div>
          )
        },
        {
          id: 'previdenciario',
          label: 'Previdenciário',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Débitos Previdenciários (INSS)</p>
              <p className="leading-relaxed">
                Destinado ao cálculo de revisões de aposentadorias, concessões de pensões e benefícios previdenciários e assistenciais pagos em atraso pelo INSS.
              </p>
              <p className="leading-relaxed">
                Seguem as diretrizes consolidadas no Manual de Orientação de Procedimentos para os Cálculos na Justiça Federal, utilizando índices específicos como o INPC e o IPCA-E de acordo com a época do débito.
              </p>
            </div>
          )
        },
        {
          id: 'precatoriostributario',
          label: 'Prec. tributário',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Precatórios - Tributários</p>
              <p className="leading-relaxed">
                Requisições de pagamento de natureza fiscal/tributária expedidas pelo Judiciário contra entes públicos. Seguem a disciplina da EC 113/2021, com correção e juros consolidados unicamente na taxa SELIC a partir de dezembro/2021.
              </p>
            </div>
          )
        },
        {
          id: 'precatoriosnaotributario',
          label: 'Prec. não tributário',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Precatórios - Não Tributários</p>
              <p className="leading-relaxed">
                Requisições de pagamento de natureza comum ou alimentar (salários, indenizações) expedidas contra o poder público.
                São corrigidas monetariamente até o efetivo pagamento, utilizando o IPCA-E como indexador constitucional de inflação, acumulado mensalmente.
              </p>
            </div>
          )
        },
        {
          id: 'multadiaria',
          label: 'Multa diária',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Multa Diária (Astreintes)</p>
              <p className="leading-relaxed">
                Penalidade de caráter coercitivo imposta pelo juiz para compelir a parte ao cumprimento de obrigações de fazer ou não fazer dentro do prazo estabelecido.
              </p>
              <p className="leading-relaxed">
                O cálculo é realizado de forma linear, multiplicando-se o valor unitário diário da multa pelo número de dias decorridos em mora (dias úteis ou corridos, conforme a decisão judicial).
              </p>
            </div>
          )
        },
        {
          id: 'abatimentos',
          label: 'Abatimentos',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Abatimentos (Deduções)</p>
              <p className="leading-relaxed">
                Lógica para abatimento de valores pagos parcialmente no decorrer da ação (amortizações).
              </p>
              <p className="leading-relaxed">
                Cada amortização deve ser corrigida monetariamente até a data do pagamento correspondente e depois subtraída do saldo devedor acumulado até aquele momento, evitando cobranças em duplicidade ou enriquecimento sem causa.
              </p>
            </div>
          )
        }
      ]
    },
    indiceCorrecao: {
      title: 'Sobre Índices de Correção',
      tabs: [
        {
          id: 'ipcae',
          label: 'IPCA-E',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">IPCA-E (Índice de Preços ao Consumidor Amplo Especial)</p>
              <p className="leading-relaxed">
                Calculado pelo IBGE, o IPCA-E afere a inflação acumulada de forma trimestral para as famílias residentes nas principais áreas metropolitanas do país.
              </p>
              <p className="leading-relaxed text-blue-600 dark:text-[#007aff] font-medium">
                Consagrado pelo Supremo Tribunal Federal (STF) como o indexador padrão de inflação para a correção de débitos judiciais de natureza não tributária contra a Fazenda Pública (2015 em diante) e precatórios.
              </p>
            </div>
          )
        },
        {
          id: 'igpm',
          label: 'IGP-M',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">IGP-M (Índice Geral de Preços do Mercado)</p>
              <p className="leading-relaxed">
                Calculado mensalmente pela Fundação Getulio Vargas (FGV). É historicamente apelidado de "inflação do aluguel" por ser o índice padrão para reajustes de locação e fornecimento de energia elétrica.
              </p>
              <p className="leading-relaxed">
                Sofre forte impacto do índice de preços por atacado (IPA), de commodities agrícolas/industriais e da variação cambial do dólar.
              </p>
            </div>
          )
        },
        {
          id: 'tr',
          label: 'TR',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">TR (Taxa Referencial)</p>
              <p className="leading-relaxed">
                Indexador econômico associado ao rendimento das cadernetas de poupança e reajuste do saldo de contas do FGTS. Permaneceu fixada em 0% (zerada) por longos períodos históricos recentes.
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r text-xs">
                <strong>Restrição Judicial:</strong> O STF julgou inconstitucional a utilização da TR como indexador de correção para dívidas judiciais civis comuns, sob o argumento de que ela não recompõe a desvalorização inflacionária da moeda.
              </div>
            </div>
          )
        },
        {
          id: 'igpdi',
          label: 'IGP-DI',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">IGP-DI (Índice Geral de Preços - Disponibilidade Interna)</p>
              <p className="leading-relaxed">
                Apurado pela FGV abrangendo o mês civil cheio (do primeiro ao último dia do mês de referência).
              </p>
              <p className="leading-relaxed">
                Mede a evolução de preços na cadeia produtiva (matérias-primas e atacado) e no consumo. Muito utilizado para reajuste de contratos corporativos e precatórios antigos da Fazenda Pública.
              </p>
            </div>
          )
        },
        {
          id: 'ipca',
          label: 'IPCA',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">IPCA (Índice Nacional de Preços ao Consumidor Amplo)</p>
              <p className="leading-relaxed">
                A inflação oficial do país apurada mensalmente pelo IBGE. Seu objetivo é medir a variação de preços no comércio de bens e prestação de serviços para famílias que ganham de 1 a 40 salários mínimos.
              </p>
            </div>
          )
        },
        {
          id: 'cdi',
          label: 'CDI',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">CDI (Certificado de Depósito Interbancário)</p>
              <p className="leading-relaxed">
                Taxa de referência para as transações diárias de captação e empréstimo entre instituições financeiras.
              </p>
              <p className="leading-relaxed">
                Usada como taxa básica em contratos de mútuo comercial, financiamentos de mercado e na atualização de obrigações privadas e bancárias.
              </p>
            </div>
          )
        },
        {
          id: 'selic',
          label: 'SELIC',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Taxa SELIC</p>
              <p className="leading-relaxed">
                Taxa básica de juros do Banco Central. Diferentemente de outros indexadores, o acúmulo da SELIC engloba de forma consolidada tanto a **recomposição inflacionária** quanto os **juros moratórios**.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r text-xs">
                <strong>Atenção:</strong> Por sua natureza mista, ao selecionar a SELIC como indexador de correção, não deve incidir cumulação de taxas de juros moratórios adicionais no período.
              </div>
            </div>
          )
        },
        {
          id: 'semcorrecaomonetaria',
          label: 'SEM CORREÇÃO',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Sem Correção Monetária (Valor Nominal)</p>
              <p className="leading-relaxed">
                Mantém o valor do principal idêntico ao histórico original (nominal), sem aplicação de qualquer indexador de recomposição inflacionária ao longo do tempo.
              </p>
            </div>
          )
        },
        {
          id: 'tjrj11960',
          label: 'TJRJ 11.960/09',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">TJRJ 11.960/2009</p>
              <p className="leading-relaxed">
                Tabela prática oficial adotada pelo Tribunal de Justiça do Estado do Rio de Janeiro para condenações não tributárias contra a Fazenda Pública, seguindo a rentabilidade oficial das cadernetas de poupança (baseadas em TR).
              </p>
            </div>
          )
        },
        {
          id: 'tjrj6899',
          label: 'TJRJ LEI 6.899/81',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">TJ/RJ Lei 6.899/81 (UFIR-RJ)</p>
              <p className="leading-relaxed">
                Tabela de correção tradicional do Tribunal de Justiça do Rio de Janeiro para liquidações civis de direito privado, baseada na variação histórica da UFIR-RJ e indexadores antecedentes (ORTN, OTN, BTN).
              </p>
            </div>
          )
        }
      ]
    },
    jurosIndice: {
      title: 'Sobre Índices de Juros',
      tabs: [
        {
          id: 'codigo',
          label: 'CÓDIGO CIVIL',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Juros do Código Civil (Artigo 406)</p>
              <p className="leading-relaxed">
                Taxa de juros moratórios de natureza civil. É aplicada no patamar de **6% ao ano** (0,5% ao mês) até a vigência do Código Civil de 1916 (até 10/01/2003) e eleva-se para **12% ao ano** (1% ao mês) a partir da entrada em vigor do Código Civil de 2002 (desde 11/01/2003).
              </p>
            </div>
          )
        },
        {
          id: 'jurossimples6',
          label: 'SIMPLES 6% A.A.',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Juros Simples de 6% ao Ano</p>
              <p className="leading-relaxed">
                Aplica-se linearmente a taxa fixa de **0,5% ao mês**, calculada exclusivamente sobre o valor do principal atualizado, sem ocorrência de juros sobre juros (capitalização). Muito utilizada em execuções de servidores públicos de períodos passados.
              </p>
            </div>
          )
        },
        {
          id: 'jurossimples12',
          label: 'SIMPLES 12% A.A.',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Juros Simples de 12% ao Ano</p>
              <p className="leading-relaxed">
                Aplica-se linearmente a taxa fixa de **1,0% ao mês**, calculada sobre o valor do principal atualizado. É a taxa padrão moratória mais utilizada no âmbito das obrigações civis privadas comuns.
              </p>
            </div>
          )
        },
        {
          id: 'taxalegal',
          label: 'TAXA LEGAL',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Taxa Legal Judiciária</p>
              <p className="leading-relaxed">
                Segue a evolução histórica determinada nos tribunais estaduais brasileiros:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>Até 10/01/2003:</strong> Incidência de 1% ao mês.</li>
                <li><strong>De 11/01/2003 a 09/01/2006:</strong> Incidência de 0,5% ao mês (interpretação inicial da taxa do CC/02).</li>
                <li><strong>A partir de 10/01/2006:</strong> Incidência restaurada para 1% ao mês.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'poupancanova',
          label: 'POUPANÇA NOVA',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Poupança Nova (Lei 12.703/2012)</p>
              <p className="leading-relaxed">
                Critério de rendimento da poupança instituído pós-03/05/2012:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Se a taxa básica SELIC for superior a 8,5% a.a., renderá **0,5% ao mês** + variação da TR.</li>
                <li>Se a SELIC for menor ou igual a 8,5% a.a., os juros moratórios equivalem a **70% da taxa SELIC** + variação da TR.</li>
              </ul>
            </div>
          )
        },
        {
          id: 'poupancaantiga',
          label: 'POUPANÇA ANTIGA',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Poupança Antiga</p>
              <p className="leading-relaxed">
                Juros no percentual fixo de **0,5% ao mês** mais a variação da TR. Aplicável a depósitos judiciais e condenações civis para períodos anteriores a 03/05/2012.
              </p>
            </div>
          )
        },
        {
          id: 'poupanca',
          label: 'POUPANÇA MISTA',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Poupança (Antiga + Nova)</p>
              <p className="leading-relaxed">
                Composição temporal que comuta automaticamente as duas metodologias: aplica a Poupança Antiga (0,5% a.m.) para as parcelas do período até 03/05/2012 e adota as novas regras (atreladas à taxa SELIC) do dia 04/05/2012 em diante.
              </p>
            </div>
          )
        },
        {
          id: 'selic',
          label: 'SELIC',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Juros SELIC</p>
              <p className="leading-relaxed">
                Taxa de juros atrelada à taxa básica da economia, acumulada mês a mês. Não deve ser cumulada com correção monetária apartada nas fases judiciais, pois já a inclui intrinsecamente.
              </p>
            </div>
          )
        },
        {
          id: 'cdi',
          label: 'CDI',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Juros CDI</p>
              <p className="leading-relaxed">
                Usa os fatores acumulados do CDI para a incidência de juros, comum em simulações financeiras de investimentos ou cobranças entre empresas comerciais do setor de crédito.
              </p>
            </div>
          )
        },
        {
          id: 'especificartaxa',
          label: 'TAXA CUSTOM',
          content: (
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">Taxa Especificada pelo Usuário</p>
              <p className="leading-relaxed">
                Opção flexível em que o percentual de juros anual é preenchido manualmente no painel de controle pelo usuário, sendo aplicado na modalidade de juros simples lineares.
              </p>
            </div>
          )
        }
      ]
    }
  };

  const currentConfig = configs[context];
  const [activeTabId, setActiveTabId] = useState(currentConfig.tabs[0].id);

  // Efeito para sincronizar a aba com o valor atualmente selecionado no formulário
  useEffect(() => {
    if (isOpen) {
      const initialTabId = currentConfig.tabs.some(t => t.id === selectedValue)
        ? selectedValue
        : currentConfig.tabs[0].id;
      if (initialTabId) {
        setActiveTabId(initialTabId);
      }
    }
  }, [isOpen, selectedValue, context]);

  const activeTab = currentConfig.tabs.find((t: any) => t.id === activeTabId) || currentConfig.tabs[0];
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
      <div
        ref={cardRef}
        className="bg-white dark:bg-[#010409] border border-gray-200 dark:border-[#21262d] rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-5 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-[#21262d]">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
            {currentConfig.title}
          </h2>
        </div>

        {/* Menu Dropdown de Seleção */}
        <div className="p-4 bg-gray-50/50 dark:bg-[#0d1117]/10 border-b border-gray-100 dark:border-[#21262d]">
          <select
            value={activeTabId}
            onChange={(e) => setActiveTabId(e.target.value)}
            className="w-full p-2.5 bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#30363d] rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#007aff] transition-shadow cursor-pointer"
          >
            {currentConfig.tabs.map((tab: any) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50/20 dark:bg-[#0d1117]/5 flex-1 min-h-[220px]">
          <div className="transition-all duration-150 ease-out">
            {activeTab.content}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#010409]/60 border-t border-gray-100 dark:border-[#21262d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-[#007aff] dark:hover:bg-[#0066d6] shadow-sm hover:shadow active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
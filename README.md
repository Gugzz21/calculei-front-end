# 📊 Calculei — Atualização Monetária

> Aplicação web para cálculo de **atualização monetária e juros** sobre débitos e créditos, com suporte a múltiplos índices econômicos oficiais brasileiros.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Arquitetura e Fluxo](#arquitetura-e-fluxo)
- [Índices Suportados](#índices-suportados)
- [Tipos de Cálculo](#tipos-de-cálculo)
- [Exportação de Relatórios](#exportação-de-relatórios)
- [Sistema de Token de Recuperação](#sistema-de-token-de-recuperação)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Configuração do Proxy](#configuração-do-proxy)
- [Scripts Disponíveis](#scripts-disponíveis)

---

## Sobre o Projeto

O **Calculei** é uma calculadora jurídica virtual desenvolvida para auxiliar advogados, servidores do Judiciário e demais profissionais do Direito na realização de **cálculos de atualização monetária e juros** sobre valores de processos judiciais.

A aplicação se comunica com um **backend Java (Spring Boot)** rodando em `localhost:8080`, que fornece os fatores acumulados dos índices econômicos (IPCA-E, SELIC, CDI, IGP-M, etc.) através de uma API REST.

---

## Funcionalidades

### 🧮 Cálculo de Atualização Monetária
- Informar **valor principal**, **data inicial** e **data do cálculo**
- Selecionar o **tipo de cálculo** (ex: Débitos da Fazenda, Precatórios, Créditos entre Particulares)
- Escolher o **índice de correção monetária** (IPCA-E, IGPM, SELIC, CDI, TR, UFIR-RJ, etc.)
- O índice de correção é **pré-selecionado automaticamente** conforme o tipo de cálculo
- Resultado com **valor atualizado**, **percentual de correção** e **número de dias** do período

### 💸 Aplicação de Juros (opcional)
- Ativado via checkbox **"Aplicar juros?"** (disponível apenas quando o índice de correção não inclui juros embutidos, como SELIC)
- Suporte a **múltiplos períodos de juros** (juros aplicados sequencialmente)
- Índices de juros disponíveis:
  - Taxa Legal, Código Civil
  - Juros Simples 6% a.a. e 12% a.a.
  - SELIC, CDI, Poupança (Nova, Antiga e combinada)
  - Taxa personalizada pelo usuário
- Pré-visualização em tabela antes de confirmar a aplicação

### 📑 Tabela de Lançamentos
- Múltiplos lançamentos podem ser calculados e acumulados na mesma sessão
- **Paginação** com seletor de itens por página (5, 10 ou 15)
- Exibição de **totais** (valor principal, atualizado, juros, total geral)
- Possibilidade de **remover** lançamentos individualmente
- Navegação por página via botões ou campo de entrada direta

### 📤 Exportação de Relatórios
- **Exportar como PDF**: Gera um relatório em formato A4 paisagem com tabela completa, totais e token de recuperação embutido
- **Exportar como Imagem (JPEG)**: Captura toda a tabela (incluindo páginas não visíveis) e salva como imagem

### 🔑 Sistema de Token de Recuperação
- A cada exportação (PDF ou imagem), um **UUID único** é gerado e salvo no backend vinculado aos dados dos lançamentos
- O token é **exibido em modal** para o usuário copiar
- O token também é **impresso no próprio PDF** (bloco âmbar com destaque visual)
- Funcionalidade **"Recuperar por Token"**: permite buscar e reimprimir lançamentos de sessões anteriores informando apenas o token

### 🧹 Limpar Formulário
- Restaura todos os campos do formulário para os valores padrão com um clique

### ⚠️ Validações
- Valor principal obrigatório
- Data inicial obrigatória
- Data do cálculo não pode ser futura
- Data do cálculo deve ser posterior à data inicial
- Mensagens de erro exibidas inline no formulário

---

## Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Descrição |
|---|---|---|
| **React** | 19.2.4 | Biblioteca principal de UI |
| **TypeScript** | 5.9.3 | Tipagem estática |
| **Vite** | 7.3.2 | Build tool e dev server |
| **Tailwind CSS** | 4.2.2 | Estilização utilitária (plugin nativo Vite) |
| **MUI (Material UI)** | 9.0.0 | Componentes e ícones (`@mui/icons-material`) |
| **Emotion** | 11.14.0 | Engine CSS-in-JS para o MUI |
| **Lucide React** | 0.577.0 | Ícones adicionais |
| **React Icons** | 5.6.0 | Coleção extra de ícones |

### Exportação / Relatórios

| Biblioteca | Versão | Uso |
|---|---|---|
| **jsPDF** | 4.2.1 | Geração de arquivos PDF |
| **jspdf-autotable** | 5.0.7 | Tabelas automáticas dentro do PDF |
| **html2canvas** | 1.4.1 | Captura de DOM como canvas |
| **html-to-image** | 1.11.13 | Conversão de elementos HTML para imagem |

### Backend (não incluso neste repositório)

| Tecnologia | Observação |
|---|---|
| **Java / Spring Boot** | API REST rodando em `localhost:8080` |
| Endpoints de índices econômicos | IPCA-E, IPCA, IGP-M, IGP-DI, TR, CDI, SELIC, Poupança, UFIR-RJ |
| Endpoint de histórico | `POST /history/save` e `GET /history/findbytoken` |

---

## Estrutura do Projeto

```
src/
├── App.tsx                        # Componente raiz — estado global e handlers
├── main.tsx                       # Entry point React
├── index.css / App.css            # Estilos globais
│
├── types/
│   └── index.ts                   # Interfaces globais: FormState, JurosState,
│                                  #   LancamentoItem, JurosAplicado, DadosRecuperados
│
├── constants/
│   └── dominios.ts                # Domínios centralizados:
│                                  #   TIPO_CALCULO_OPCOES, INDICE_CORRECAO_OPCOES,
│                                  #   DESCRICAO_OPCOES, JUROS_INDICE_OPCOES,
│                                  #   TIPO_CALCULO_INDICE_MAP, labels e descrições
│
├── services/
│   ├── api.ts                     # Camada de comunicação com o backend:
│   │                              #   calcularIndice(), calcularJuros(),
│   │                              #   salvarHistorico(), buscarPorToken()
│   └── calcular.ts                # Orquestrador de cálculo (correção + juros):
│                                  #   calcularLancamento()
│
└── components/
    ├── Header.tsx                 # Cabeçalho da aplicação
    ├── Footer.tsx                 # Rodapé da aplicação
    │
    ├── CentralCard/               # Formulário principal de entrada
    │   ├── CentralCard.tsx        # Container do formulário
    │   ├── TipoCalculo.tsx        # Select: tipo de cálculo
    │   ├── IndiceCorrecao.tsx     # Select: índice de correção monetária
    │   ├── Descricao.tsx          # Select: descrição/natureza do débito
    │   ├── InputValor.tsx         # Input de valor monetário (máscara R$)
    │   ├── Data.tsx               # Input de data reutilizável
    │   ├── Juros.tsx              # Painel expandível de juros com períodos
    │   ├── Calcular.tsx           # Botão de calcular (com loading)
    │   ├── Limpar.tsx             # Botão de limpar formulário
    │   └── Form.tsx               # Wrapper de formulário
    │
    └── Lancamentos/               # Tabela de resultados e exportações
        ├── Lancamentos.tsx        # Container principal (estado de paginação,
        │                          #   modais, handlers de exportação)
        ├── TabelaLancamentos.tsx  # Tabela com linhas, totais e botão remover
        ├── Paginacao.tsx          # Controles de paginação reutilizáveis
        ├── BotoesExport.tsx       # Botões: PDF, Imagem, Recuperar Token
        ├── ModalToken.tsx         # Modal de exibição do token gerado
        ├── ModalRecuperar.tsx     # Modal de recuperação de sessão por token
        ├── exportPDF.ts           # Lógica de geração de PDF (jsPDF + autotable)
        ├── exportImagem.ts        # Lógica de captura e download de imagem
        ├── utils.ts               # Helpers: formatBRL, formatDate, gerarUUID
        └── types.ts               # Tipos locais: LancamentoRecuperado
```

---

## Arquitetura e Fluxo

```
Usuário preenche formulário (CentralCard)
        │
        ▼
App.tsx aciona handleCalcular()
        │
        ▼
calcularLancamento() [services/calcular.ts]
    ├── calcularIndice()  ──► POST /api/{indice}/calculate/between-dates
    └── calcularJuros()   ──► POST /api/{juros}/calculate/between-dates
                              ou cálculo local (taxa fixa)
        │
        ▼
Resultado adicionado ao estado lancamentos[]
        │
        ▼
Tabela de Lançamentos atualizada (Lancamentos.tsx)
        │
        ├── Exportar PDF  ──► jsPDF + autotable + token salvo no backend
        ├── Exportar Imagem ► html-to-image + token salvo no backend
        └── Recuperar Token ► GET /api/history/findbytoken?token=...
```

---

## Índices Suportados

### Correção Monetária

| Código | Índice |
|---|---|
| `ipcae` | IPCA-E |
| `ipca` | IPCA |
| `igpm` | IGP-M |
| `igpdi` | IGP-DI |
| `tr` | TR |
| `cdi` | CDI |
| `selic` | SELIC |
| `semcorrecaomonetaria` | Sem correção monetária |
| `tjrj119602009ipcaeselic` | TJRJ Lei 11.960/2009 (IPCA/SELIC) |
| `tjrj6899` | TJ/RJ Lei 6.899/81 (UFIR-RJ) |

### Juros

| Código | Descrição |
|---|---|
| `taxalegal` | Taxa Legal (1%/mês após jan/2003) |
| `codigocivil` | Código Civil (0,5%/mês até jan/2003; 1%/mês depois) |
| `jurossimples6` | Juros Simples 6% a.a. (0,5%/mês) |
| `jurossimples12` | Juros Simples 12% a.a. (1%/mês) |
| `selic` | SELIC acumulada (API) |
| `cdi` | CDI acumulado (API) |
| `poupancanova` | Poupança Nova (API) |
| `poupancaantiga` | Poupança Antiga (API) |
| `poupanca` | Poupança Antiga + Nova (API) |
| `especificartaxa` | Taxa personalizada pelo usuário (% a.a.) |

---

## Tipos de Cálculo

| Código | Descrição | Índice pré-selecionado |
|---|---|---|
| `dfazendatributario` | Débitos da Fazenda Pública — Tributários | SELIC |
| `dfazendanaotributario` | Débitos da Fazenda Pública — Não Tributários | TJRJ 11.960/2009 |
| `abatimentos` | Abatimentos | Sem correção monetária |
| `cdparticular` | Créditos / Débitos Entre Particulares | UFIR-RJ |
| `cfazenda` | Créditos da Fazenda Pública | UFIR-RJ |
| `previdenciario` | Débitos Previdenciários | — |
| `precatoriostributario` | Precatórios — Tributários | — |
| `precatoriosnaotributario` | Precatórios — Não Tributários | — |
| `multadiaria` | Multa Diária | — (exibe total de dias e valor da multa) |

---

## Exportação de Relatórios

### PDF (`exportarParaPDF`)
- Formato **A4 horizontal (paisagem)**
- Tabela com colunas: Descrição, Datas, Valor Principal, Índice Correção, Valor Atualizado, Dias, % Correção, Índice Juros, Juros, Total
- Linha de **Total Geral** ao final (quando há mais de 1 lançamento)
- **Bloco do Token** em destaque âmbar ao fim do documento
- **Paginação** automática no rodapé (Página X de Y)
- Token gerado e salvo no backend **antes** do download

### Imagem (`baixarImagem`)
- Captura **toda a tabela** independentemente da página ativa
- Formato **JPEG** com alta resolução (`pixelRatio: 2`)
- Restaura a paginação original após a captura
- Token gerado e exibido em modal após o download

---

## Sistema de Token de Recuperação

O sistema permite que o usuário **retome uma sessão de cálculos anterior** sem precisar refazer tudo.

**Fluxo de salvamento:**
1. Usuário exporta PDF ou imagem
2. Frontend gera um `UUID v4` único
3. Os dados dos lançamentos são serializados como JSON e enviados via `POST /api/history/save`
4. O token é exibido em modal e/ou impresso no PDF

**Fluxo de recuperação:**
1. Usuário clica em **"Recuperar por Token"**
2. Informa o UUID gerado anteriormente
3. Sistema consulta `GET /api/history/findbytoken?token=<uuid>`
4. Os lançamentos recuperados são carregados diretamente na tabela principal
5. O usuário pode gerar um novo PDF com os dados recuperados

---

## Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Backend Java** rodando em `localhost:8080` com os endpoints dos índices econômicos e histórico

---

## Instalação e Execução

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Replica_calculei_REACT

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:5173** (ou porta configurada pelo Vite).

> **Atenção:** O backend Java deve estar rodando em `localhost:8080` para que os cálculos funcionem. Sem o backend, as requisições à API retornarão erro.

---

## Configuração do Proxy

O arquivo `vite.config.ts` configura um proxy para redirecionar chamadas `/api` ao backend:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

Isso significa que `fetch('/api/ipca/calculate/between-dates')` no frontend é transparentemente redirecionado para `http://localhost:8080/ipca/calculate/between-dates`.

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Compila TypeScript e gera o bundle de produção |
| `npm run preview` | Serve o bundle de produção localmente |
| `npm run lint` | Executa o ESLint no código-fonte |

---

## Estrutura de Dados Principal

### `LancamentoItem`
```ts
interface LancamentoItem {
  id: number;
  numero: ReactNode;
  descricao: string;
  dataInicial: string;       // YYYY-MM-DD
  valorPrincipal: number;
  dataCalculo: string;       // YYYY-MM-DD
  indiceCorrecao: string;    // Label do índice
  valorAtualizado: number;
  dias: number;
  percentualCorrecao: number;
  indiceJuros: string;       // Label do índice de juros
  dataInicioJuros: string;
  dataFimJuros: string;
  juros: number;
  total: number;             // valorAtualizado + juros
}
```

### `FormState`
```ts
interface FormState {
  valor: string;           // Dígitos brutos (sem ponto/vírgula)
  dataInicial: string;
  dataCalculo: string;
  indiceCorrecao: string;
  tipoCalculo: string;
  descricao: string;
}
```

### `JurosState`
```ts
interface JurosState {
  enabled: boolean;
  indice: string;
  dataInicio: string;
  dataFim: string;
  taxa: string;            // % a.a. em formato PT-BR (ex: "12,00")
  aplicados: JurosAplicado[];
}


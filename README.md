# Calculei — Calculadora de Atualização Monetária

Réplica frontend da calculadora de atualização monetária do sistema **Calculei**, voltada para cálculos judiciais no âmbito do Tribunal de Justiça do Estado do Rio de Janeiro (TJ/RJ).

---

## O que é a aplicação?

O **Calculei** é uma calculadora jurídica de atualização monetária que permite calcular o valor atualizado de débitos e créditos com base em índices econômicos oficiais. A aplicação replica a lógica da calculadora do TJ/RJ, sendo validada contra os resultados oficiais do portal do Poder Judiciário do Estado do Rio de Janeiro.

## O que ela faz?

- **Calcula a correção monetária** de um valor principal com base no tipo de cálculo e índice selecionado, para um período definido entre datas.
- **Suporta múltiplos tipos de cálculo**, incluindo:
  - Créditos / Débitos entre Particulares (Natureza Civil)
  - Créditos e Débitos da Fazenda Pública (Tributários e Não Tributários)
  - Débitos Previdenciários
  - Precatórios (Tributários e Não Tributários)
  - Multa diária
  - Abatimentos
- **Aplica os índices de correção monetária corretos** conforme a legislação:
  - **TJ/RJ Lei 6.899/81 (UFIR-RJ)** — Natureza Civil → usa IPCA-E via Banco Central
  - **TJ/RJ Lei 11.960/2009** — Fazenda Pública → IPCA-E até 30/11/2021 + SELIC a partir de 01/12/2021 (conforme EC 113/2021)
  - IPCA, IPCA-E, IGP-M, IGP-DI, TR, SELIC, CDI e outros
- **Calcula juros** (simples ou compostos) sobre o valor corrigido com múltiplos índices disponíveis.
- **Gerencia múltiplos lançamentos** em uma tabela, com suporte a edição, duplicação, remoção e paginação.
- **Exporta os resultados** em PDF (via jsPDF ou @react-pdf/renderer), Excel (ExcelJS) e imagem (html2canvas / html-to-image).
- **Salva e recupera históricos** por token de recuperação via backend.
- **Modo claro/escuro** com detecção automática da preferência do sistema.

---

<<<<<<< HEAD
## Tecnologias utilizadas (Frontend)

| Tecnologia | Versão | Descrição |
|---|---|---|
| **React** | 19.2.0 | Biblioteca principal de UI |
| **React DOM** | 19.2.0 | Renderização no browser |
| **TypeScript** | 5.9.3 | Tipagem estática |
| **Vite** | 7.3.1 | Bundler e servidor de desenvolvimento |
| **Tailwind CSS** | 4.2.1 | Utilitários CSS |
| **@tailwindcss/vite** | 4.2.1 | Plugin Tailwind para Vite |
| **MUI Material** | 9.0.0 | Componentes de interface (tabelas, modais) |
| **MUI Icons Material** | 9.0.0 | Ícones Material Design |
| **@emotion/react** | 11.14.0 | Engine de CSS-in-JS (dependência do MUI) |
| **@emotion/styled** | 11.14.1 | Componentes estilizados (dependência do MUI) |
| **Lucide React** | 0.577.0 | Ícones SVG |
| **React Icons** | 5.6.0 | Coleção de ícones |
| **React Hot Toast** | 2.6.0 | Notificações toast |
| **@react-pdf/renderer** | 4.4.0 | Geração de PDF no browser |
| **jsPDF** | 4.2.1 | Geração de PDF alternativo |
| **jsPDF AutoTable** | 5.0.7 | Plugin de tabelas para jsPDF |
| **ExcelJS** | 4.4.0 | Geração de planilhas Excel |
| **file-saver** | 2.0.5 | Download de arquivos no browser |
| **html2canvas** | 1.4.1 | Captura de tela (screenshot) |
| **html-to-image** | 1.11.13 | Conversão de HTML para imagem |
| **ESLint** | 9.39.1 | Linter de código |
| **typescript-eslint** | 8.48.0 | Regras ESLint para TypeScript |

---

=======
>>>>>>> feature/inicial
## Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- Backend Java (Spring Boot) rodando em `http://localhost:8080` *(opcional — a aplicação funciona sem ele via fallback do Banco Central)*

---

## Como iniciar a aplicação

### 1. Clone o repositório e acesse a pasta do projeto

```bash
<<<<<<< HEAD
git clone <url-do-repositório>
cd Replica_calculei_REACT
=======
git clone http://gitlab.mprj.mp.br/gate/calculei-front-end.git
cd calculei-front-end
>>>>>>> feature/inicial
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

> O Vite configura um proxy automático: requisições para `/api/*` são redirecionadas para `http://localhost:8080/*`. Se o backend Java não estiver rodando, os índices são buscados automaticamente na API pública do Banco Central do Brasil.

### Outros comandos disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com hot reload |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Serve localmente o build de produção |
| `npm run lint` | Executa o linter ESLint |

---

## Como usar a aplicação

### Adicionando um lançamento

1. **Tipo de Cálculo** — Selecione o tipo de débito ou crédito (ex: *Créditos / Débitos Entre Particulares*). O índice de correção é pré-selecionado automaticamente conforme a legislação aplicável.
2. **Índice de Correção Monetária** — Confirme ou altere o índice. Apenas os índices aplicáveis ao tipo de cálculo são exibidos.
3. **Descrição** — Selecione a natureza do lançamento (ex: *Ressarcimento*, *Honorários Advocatícios*).
4. **Valor Principal** — Informe o valor em reais (ex: `100,00`).
5. **Aplicar juros?** — Marque o checkbox se desejar incluir juros, configure o índice e período no painel que surgirá abaixo.
6. **Data Inicial** — Data de início da correção monetária.
7. **Data do Cálculo** — Data final (não pode ser futura).
8. Clique em **Calcular** — O lançamento é adicionado à tabela de resultados.

### Tabela de lançamentos

- Os lançamentos exibem: data inicial, data final, valor principal, índice, fator de correção, valor corrigido, juros e total devido.
- Cada linha possui ações de **editar** ✏️, **duplicar** 🗃️ e **remover** 🗑️.
- A duplicação permite gerar múltiplas parcelas com datas diferentes automaticamente.

### Exportação

Utilize os botões no topo da tabela:
- **Gerar PDF** — Exporta a tabela completa em PDF.
- **Printar e salvar** — Captura a tela e salva como imagem.
- **Exportar Excel** — Gera uma planilha `.xlsx` com os lançamentos.

### Salvar e recuperar histórico

- Clique no ícone de **salvar** para gerar um token de recuperação.
- Em outra sessão, insira o token para recuperar os lançamentos salvos.

---

## Fontes de dados

| Fonte | Uso |
|---|---|
| **Backend Java (Spring Boot)** | Fonte primária — dados históricos dos índices no banco de dados |
| **API BCB (Banco Central do Brasil)** | Fallback automático quando o backend não tem dados |

Quando o banco de dados do backend estiver vazio (sem dados históricos populados), a aplicação busca automaticamente os índices na **API pública do SGS/BCB** (`https://api.bcb.gov.br`), garantindo resultados corretos mesmo sem o backend configurado.

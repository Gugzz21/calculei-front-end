# Calculei — Calculadora Jurídica Online

O **Calculei** é uma calculadora jurídica virtual desenvolvida para auxiliar advogados, servidores do Judiciário e demais profissionais do Direito na realização de **cálculos de atualização monetária e juros** sobre valores de processos judiciais.

> ⚠️ A presente calculadora virtual **não substitui** o cálculo realizado e homologado judicialmente. Todos os valores estão em Reais (R$).

---

## 📌 O que é o Calculei?

O Calculei permite calcular, de forma simples e rápida, quanto um valor deve ser **corrigido monetariamente** ao longo do tempo, aplicando índices oficiais utilizados pela Justiça brasileira, como IPCA, SELIC, IGPM, TR, entre outros.

É especialmente útil para cálculos envolvendo:

- Créditos e débitos entre particulares
- Créditos da Fazenda Pública
- Débitos Tributários e Não Tributários da Fazenda Pública
- Débitos Previdenciários
- Precatórios (Tributários e Não Tributários)
- Multas diárias

---

## ⚙️ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Tipo de Cálculo** | Selecione a natureza jurídica do crédito ou débito |
| **Índice de Correção Monetária** | Escolha o índice oficial (IPCA, SELIC, IGPM, TR, CDI, etc.) |
| **Valor Principal** | Informe o valor em R$ a ser corrigido |
| **Data Inicial** | Data de início da correção monetária |
| **Data do Cálculo** | Data de referência para o cálculo (geralmente hoje) |
| **Descrição** | Classifique o lançamento (Ressarcimento, Multa Civil, etc.) |
| **Juros** | Toggle para ativar/desativar o cálculo de juros separadamente, com índice e período próprios |
| **Lançamentos** | Tabela com o histórico de todos os cálculos realizados na sessão |

---

## 🏛️ Contexto

O Calculei foi desenvolvido seguindo as diretrizes do **GATE MPRJ — Grupo de Apoio Técnico Especializado** do Ministério Público do Estado do Rio de Janeiro, em conformidade com a **DIRETRIZ TÉCNICA nº 010/2020 - MPRJ 2019.00273069**.

---

## 📋 Pré-requisitos

Antes de rodar o projeto, certifique-se de ter instalado:

- **Node.js** v18 ou superior
- **npm** v9 ou superior
- **Backend Java** (Spring Boot) rodando localmente — os cálculos de índices (IPCA, SELIC, IGPM, etc.) são realizados via API REST pelo servidor Java
```
    Isso irá mudar quando o houver deploy do backend
```

---

## 🚀 Como rodar o projeto

### 1. Backend Java (obrigatório para os cálculos)

O frontend faz requisições para `http://localhost:8080/api`. Certifique-se de que o servidor Java esteja em execução antes de usar a calculadora.

Os índices calculados diretamente no frontend (sem backend) são:
- **Código Civil** — juros simples de 1% a.m. (12% a.a.)
- **Juros Simples 6% a.a.** — 0,5% a.m.
- **Juros Simples 12% a.a.** — 1% a.m.

### 2. Frontend React

```bash
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto utiliza **React** com **TypeScript** e **TailwindCSS v4**, criado com **Vite**. O proxy do Vite redireciona `/api` para o backend Java em `http://localhost:8080`.

---

## 🗂️ Estrutura de Componentes

```
src/
├── services/
│   └── api.ts                          # Comunicação com o backend Java (fetch)
├── components/
│   ├── Header.tsx                      # Cabeçalho com logo e link de Orientações
│   ├── Juros.tsx                       # Toggle de juros com campos adicionais
│   ├── Lancamentos.tsx                 # Tabela de lançamentos com paginação
│   ├── Footer.tsx                      # Rodapé com identidade GATE MPRJ
│   └── CentralCard/
│       ├── CentralCard.tsx             # Card principal — monta o formulário completo
│       ├── Form.tsx                    # Agrupamento dos campos do formulário
│       ├── TipoCalculo.tsx             # Select do tipo de cálculo
│       ├── IndiceCorrecao.tsx          # Select do índice de correção monetária
│       ├── InputValor.tsx              # Input de valor em R$ com máscara monetária
│       ├── Data.tsx                    # Input de data reutilizável
│       ├── Descricao.tsx               # Select de descrição do lançamento
│       ├── Calcular.tsx                # Botão de ação principal (Calcular)
│       └── Limpar.tsx                  # Botão para limpar o formulário
└── App.tsx                             # Estado global e composição da aplicação
```

---

## 🌐 Índices suportados

### Correção Monetária (via backend Java)
| Código | Índice |
|---|---|
| `ipca` | IPCA |
| `ipcae` | IPCA-E |
| `igpm` | IGP-M |
| `igpdi` | IGP-DI |
| `tr` | TR |
| `inpc` | INPC |
| `ipcbr` | IPC-BR |
| `cdi` | CDI |
| `selic` | SELIC Mensal |
| `tjrj119602009ortnotnbnttrufiripcae` | TJRJ Lei 11.960/09 (IPCA-E) |
| `tjrj119602009ipcaeselic` | TJRJ IPCA-E + SELIC |

### Juros
| Código | Cálculo |
|---|---|
| `selic` | SELIC Mensal (backend) |
| `cdi` | CDI (backend) |
| `poupanca` | Poupança nova (backend) |
| `codigocivil` | Código Civil — 1% a.m. (local) |
| `jurossimples6` | Juros simples 6% a.a. (local) |
| `jurossimples12` | Juros simples 12% a.a. (local) |

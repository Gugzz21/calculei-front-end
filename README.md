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

## 🚀 Como rodar o projeto

```bash
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O projeto utiliza **React** com **TypeScript** e **TailwindCSS**, criado com **Vite**.

---

## 🗂️ Estrutura de Componentes

```
src/
├── components/
│   ├── Header.tsx               # Cabeçalho com logo e link de Orientações
│   ├── CentralCard.tsx          # Card principal do formulário
│   │   ├── TipoCalculo.tsx      # Select do tipo de cálculo
│   │   ├── IndiceCorrecao.tsx   # Select do índice de correção monetária
│   │   ├── InputValor.tsx       # Input de valor em R$ com máscara
│   │   ├── Data.tsx             # Input de data reutilizável
│   │   └── Descricao.tsx        # Select de descrição do lançamento
│   ├── Juros.tsx                # Toggle de juros com campos adicionais
│   ├── Calcular.tsx             # Botão de ação principal
│   ├── Limpar.tsx               # Botão para limpar o formulário
│   ├── Lancamentos.tsx          # Tabela de lançamentos da sessão
│   └── Footer.tsx               # Rodapé com identidade GATE MPRJ
└── App.tsx                      # Composição geral da aplicação
```

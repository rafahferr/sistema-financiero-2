# Sistema Financeiro Pessoal — Instruções para o Claude Code

## 📍 Status Atual (atualizado em 2026-09-10)

**O sistema já está implementado e funcionando** — o conteúdo abaixo, a partir de "Contexto do Projeto", é o **brief original** que guiou a construção (mantido como referência histórica). Praticamente tudo nele foi construído. Esta seção existe para que uma sessão futura do Claude Code (ou você) recupere o contexto rapidamente sem reler o código inteiro.

**Como rodar:**
```bash
cd "financeiro"
npm run dev
# http://localhost:5173/
```

**O que existe além do brief original:**
- **Módulo Dívidas** (`/dividas`) — não estava no plano original. Funciona como o espelho de Metas Financeiras, mas para abatimento de dívida em vez de acúmulo de meta. Ver seção "6.1 Dívidas" adicionada abaixo.
- **Conversão automática de pendências em dívida** — toda despesa não paga de um mês encerrado (incluindo fixas e parcelas) vira uma dívida sozinha, ao abrir o app. Ver seção "6.1 Dívidas".
- Schema do Dexie está na versão 4 (o brief original só previa a versão 1) — ver `financeiro/src/db/database.ts` para o histórico real de migrações.
- `Lancamento` ganhou os campos `dividaId`, `pagamentoDividaId`, `origemDivida` (não previstos no brief original) para sustentar a integração com Dívidas.

**Para o histórico técnico completo e atualizado** (schema exato, bugs corrigidos, decisões tomadas, testes feitos), consulte a memória do Claude Code para este projeto — arquivo `project_sistema_financeiro.md` no sistema de memória — que é carregado automaticamente em toda nova conversa e é a fonte mais confiável e atualizada. Este arquivo `CLAUDE (1).md` é atualizado sob pedido, não automaticamente.

### Repositório GitHub e deploy (2026-09-10)

- **Repositório:** https://github.com/rafahferr/sistema-financiero-2 — **público** (necessário pra usar GitHub Pages de graça; repositório privado exige plano pago do GitHub pra publicar Pages). Raiz do repo = a pasta `SISTEMA FINANCEIRO` inteira (não só `financeiro/`), incluindo este `CLAUDE (1).md` e o atalho `.bat`.
- **Identidade git local:** configurada só com `git config --local` (não mexe na config global da máquina) — `user.name = "Rafael Ferreira"`, `user.email = alexandreroliveira76@gmail.com`.
- **Deploy automático:** workflow em `.github/workflows/deploy.yml` builda `financeiro/` (Node 22) e publica `financeiro/dist` no GitHub Pages a cada push na branch `main`. Site ao vivo: **https://rafahferr.github.io/sistema-financiero-2/**.
- **Mudanças de código feitas só por causa do GitHub Pages:**
  - `App.tsx`: `BrowserRouter` → `HashRouter` (Pages não suporta rewrite de rota de SPA sem isso; URLs viram `/#/dividas` em vez de `/dividas`)
  - `vite.config.ts`: `base: '/sistema-financiero-2/'` adicionado
- **Proteção da branch `main`:** ruleset criado em Settings → Rules → Rulesets, "Active", alvo = default branch, com "Restrict deletions" e "Block force pushes" — **sem** "Require a pull request before merging" (deixado de fora de propósito, pra não travar o push direto que a gente usa no dia a dia).
- **GitHub Pages e LGPD:** confirmado (por leitura de código — busca por `fetch`/`axios`/`XMLHttpRequest`/`WebSocket`/URLs em todo `src/` não encontrou nenhuma chamada de rede) que o app não tem NENHUMA chamada de rede — é 100% offline, todos os dados ficam só no IndexedDB do navegador de quem usa. Repositório público expõe só código, nunca dados reais (nenhum backup JSON foi commitado). LGPD Art. 4º, I exclui tratamento de dados pessoais feito por pessoa física pra fins particulares/não econômicos — não se aplica aqui. Único jeito de dado real vazar pro repo seria o usuário exportar um backup JSON (Configurações → Backup) e commitar esse arquivo manualmente — isso nunca deve ser feito.

---

## Contexto do Projeto

Transformar uma planilha financeira pessoal (Excel) em uma aplicação web local, acessível pelo navegador, com dados persistidos localmente. O usuário já usa a planilha e quer manter a lógica dela, mas com uma interface muito mais prática e visual para o dia a dia.

A planilha original tem as seguintes seções que devem ser preservadas/adaptadas:
- **Entradas e saídas mensais** com categorias, forma de pagamento, parcelas, gastos fixos
- **Resumo anual** com gráficos de entradas x saídas, top categorias, saúde financeira
- **Resumo mensal** com saldo, faturas de cartão, forma de pagamento mais usada
- **Metas financeiras** com progresso visual (ex: "Viagem Chile - R$ 9.000")
- **Investimentos** focado em FIIs (Fundos de Investimento Imobiliário)

---

## Stack Recomendada

**Frontend:** React + Vite + TypeScript  
**Estilo:** Tailwind CSS  
**Gráficos:** Recharts  
**Banco de dados local:** SQLite via `better-sqlite3` (Node.js) **ou** `localStorage`/`IndexedDB` com Dexie.js se for fullstack-free  
**Backend (opcional para fase local):** Express.js + Node.js com better-sqlite3  
**Alternativa simples (só frontend):** React + Vite + Dexie.js (IndexedDB) — tudo roda no navegador sem servidor

> **Recomendação:** Começar com a alternativa simples (React + Vite + Dexie.js), pois roda 100% local no navegador sem precisar de servidor Node. Quando quiser subir para a nuvem, migra para backend + PostgreSQL.

---

## Estrutura de Pastas

```
financeiro/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── Lancamento/
│   │   │   ├── FormLancamento.tsx       # formulário de entrada/saída
│   │   │   └── ListaLancamentos.tsx
│   │   ├── Dashboard/
│   │   │   ├── ResumoMensal.tsx
│   │   │   ├── ResumoAnual.tsx
│   │   │   ├── GraficoCategoria.tsx
│   │   │   ├── GraficoPagamento.tsx
│   │   │   └── SaudeFinanceira.tsx
│   │   ├── Metas/
│   │   │   ├── CardMeta.tsx
│   │   │   └── FormMeta.tsx
│   │   ├── Investimentos/
│   │   │   └── CarteiraFII.tsx
│   │   ├── Configuracoes/
│   │   │   ├── AbaCategoria.tsx
│   │   │   ├── AbaFormasPagamento.tsx
│   │   │   ├── AbaPreferencias.tsx
│   │   │   └── AbaBackup.tsx
│   │   ├── GamificacaoWidget.tsx        # XP, streaks, conquistas
│   │   ├── NotificacaoGastoFixo.tsx
│   │   └── NotificacaoDividasConvertidas.tsx  # NOVO — avisa conversão automática/mesclagem de dívidas
│   ├── db/
│   │   └── database.ts                  # setup do Dexie.js (IndexedDB) — real, versão 4 atual
│   ├── hooks/
│   │   ├── useLancamentos.ts
│   │   ├── useMetas.ts
│   │   ├── useDividas.ts                # NOVO — CRUD de dívidas + conversão automática de pendências
│   │   ├── useConfiguracoes.ts          # lê categorias/pagamentos do banco
│   │   └── useGamificacao.ts
│   ├── pages/
│   │   ├── Home.tsx                     # dashboard mensal
│   │   ├── Lancamentos.tsx
│   │   ├── ResumoAnual.tsx
│   │   ├── Metas.tsx
│   │   ├── Dividas.tsx                  # NOVO
│   │   ├── Investimentos.tsx
│   │   └── Configuracoes.tsx
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── package.json
└── vite.config.ts

> Nota: a estrutura real difere um pouco desta em detalhes menores (ex: `NotificacaoGastosFixos.tsx` fica direto em `components/`, não implementado em `Configuracoes/` como sub-abas separadas). Ver `financeiro/src/` para a árvore exata.
```

---

## Modelo de Dados

### Tabela `lancamentos`

```typescript
interface Lancamento {
  id?: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  data: string;                    // ISO date: "2026-06-23"
  categoria: Categoria;
  valor: number;
  formaPagamento: FormaPagamento;
  parcelado: boolean;
  numeroParcelas?: number;         // se parcelado = true
  parcelaAtual?: number;           // ex: "2/6"
  lancamentoPaiId?: number;        // ID do lançamento original (para parcelas)
  gastoFixo: boolean;
  pago: boolean;
  mes: number;                     // 1-12
  ano: number;
  // Campos adicionados para integração com o módulo Dívidas (não previstos originalmente):
  dividaId?: number;                // dívida vinculada, quando o lançamento é um pagamento dela
  pagamentoDividaId?: number;       // id do PagamentoDivida correspondente a este lançamento
  origemDivida?: 'direto_no_modulo' | 'via_fluxo'; // como o vínculo com a dívida foi criado
}
```

### Tabela `dividas` (não prevista no brief original — ver seção 11)

```typescript
interface Divida {
  id?: number;
  descricao: string;
  credor?: string;
  valorTotal: number;
  valorPago: number;                // calculado a partir da soma dos pagamentos
  dataContracao: string;
  dataVencimento?: string;
  numeroParcelas?: number;          // informativo
  valorParcela?: number;            // informativo
  categoria?: string;
  status: 'em_aberto' | 'quitada' | 'atrasada';
  observacoes?: string;
  origemLancamentoGrupoId?: number; // agrupa parcelas da mesma compra na mesma dívida
}

interface PagamentoDivida {
  id?: number;
  dividaId: number;
  valor: number;
  data: string;
  origem: 'direto_no_modulo' | 'via_fluxo';
  fluxoId?: number;               // lançamento em Fluxos que originou o pagamento (via_fluxo)
  lancamentoEspelhoId?: number;   // lançamento espelho criado em Fluxos (direto_no_modulo)
  observacao?: string;
}
```

### Tabela `metas`

```typescript
interface Meta {
  id?: number;
  nome: string;
  valorTotal: number;
  valorGuardado: number;
  cor?: string;                    // cor do card
  emoji?: string;
  ativa: boolean;
}

interface AportesMeta {
  id?: number;
  metaId: number;
  data: string;
  local: string;                   // onde está guardado (ex: "Nubank", "C6")
  valor: number;
}
```

### Tabela `investimentos_fii`

```typescript
interface FII {
  id?: number;
  ticker: string;                  // ex: "HGLG11"
  quantidade: number;
  precoMedio: number;
  dataCompra: string;
  corretora: string;
  setor?: string;                  // ex: "Logística", "Lajes Corporativas"
}

interface DividendoFII {
  id?: number;
  fiiId: number;
  mes: number;
  ano: number;
  valorTotal: number;              // dividendo recebido no mês
}
```

### Tabela `gastos_fixos` (template mensal)

```typescript
interface GastoFixo {
  id?: number;
  descricao: string;
  categoria: Categoria;
  valor: number;
  formaPagamento: FormaPagamento;
  ativo: boolean;
}
```

### Tabela `gamificacao`

```typescript
interface GamificacaoState {
  xp: number;
  nivel: number;
  streakDias: number;              // dias consecutivos registrando gastos
  ultimoRegistro: string;          // ISO date
  conquistas: string[];            // lista de IDs de conquistas desbloqueadas
}
```

---

## Tipos Enumerados

> ⚠️ **Atenção:** `Categoria` e `FormaPagamento` **não são mais tipos TypeScript fixos**. São strings dinâmicas lidas do IndexedDB. O hook `useConfiguracoes` fornece as listas atuais para os formulários. Os tipos abaixo servem apenas como referência dos valores padrão de seed.

```typescript
// Apenas para referência dos valores de seed — não usar como union type fixo
type CategoriaDefault = 'Moradia' | 'Alimentação' | 'Carro/Gasolina' | /* ... */ 'Outros';
type FormaPagamentoDefault = 'Cartão de Crédito 1' | 'Débito' | 'Pix' | /* ... */ 'Alelo';

// Usar string nos interfaces de dados:
// categoria: string
// formaPagamento: string
```

---

## Funcionalidades a Implementar

### 1. Formulário de Lançamento (`FormLancamento.tsx`)

**Campos obrigatórios:**
- **Tipo:** toggle `Receita` / `Despesa` (bem visível, com cores diferentes)
- **Descrição:** input texto livre
- **Data:** date picker (default = hoje)
- **Categoria:** select com ícone por categoria
- **Forma de pagamento:** select — Cartão de Crédito 1/2/3, Débito, Pix, Alelo, Dinheiro, Boleto
- **Valor:** input numérico formatado em R$

**Campos condicionais:**
- **Parcelado?** toggle sim/não
  - Se sim: campo "Número de parcelas" (ex: 6)
  - Sistema cria automaticamente N lançamentos futuros com `parcelaAtual = 1/6, 2/6...` nos meses seguintes
- **Gasto fixo?** checkbox — marca o lançamento como recorrente

**Comportamento:**
- Ao salvar com `parcelado = true`, criar todos os registros de parcela automaticamente nos meses seguintes
- Exibir preview do total e valor por parcela antes de salvar
- Feedback visual de sucesso ao salvar (toast notification)
- Ganhar XP ao registrar um lançamento (gamificação)

---

### 2. Lista de Lançamentos

- Filtros por: mês/ano, tipo (receita/despesa), categoria, forma de pagamento
- Agrupamento por semana dentro do mês
- Marcar como "pago" com um clique (toggle)
- Editar / excluir lançamento
- Exibir badge de parcela quando aplicável (ex: `2/6`)
- Exibir badge de "Fixo" em gastos fixos

---

### 3. Notificação de Gastos Fixos

No início de cada mês, exibir um modal/banner:
> 💡 **Início de mês!** Você tem X gastos fixos cadastrados. Deseja lançá-los automaticamente para [Mês/Ano]?

Botões: **"Sim, lançar todos"** | **"Revisar antes"** | **"Ignorar"**

Se clicar em "Revisar antes", abre lista com checkboxes para selecionar quais lançar.

---

### 4. Dashboard Mensal (`Home.tsx`)

Exibir para o mês selecionado (com navegação ← mês →):

**Cards de resumo no topo:**
- Total de Entradas (verde)
- Total de Saídas (vermelho)
- Saldo do Mês (azul)
- Investido no Mês (roxo)

**Gráficos (usar Recharts):**
- **Donut chart:** Gastos por categoria
- **Bar chart:** Entradas x Saídas (últimas semanas do mês)
- **Bar chart horizontal:** Top 5 categorias do mês

**Tabela de Faturas de Cartão:**
| Cartão | Fatura | Status |
|--------|--------|--------|
| Cartão 1 | R$ 1.200 | ✅ Pago / ❌ Em aberto |

**Saúde financeira:**
- Indicador visual (igual à planilha):
  - 🟢 Excelente — gastou menos que ganhou
  - 🟡 Atenção — margem pequena
  - 🔴 Alerta — gastou mais que ganhou

**Gastos por forma de pagamento:**
- Mini barras: 💳 Crédito | 💰 Débito | 💸 Pix | 🧾 Boleto | etc.

---

### 5. Resumo Anual (`ResumoAnual.tsx`)

- **Cards anuais:** Total Entradas / Total Saídas / Total Investido / Saldo Anual
- **Line/Bar chart:** Entradas x Saídas mês a mês (12 colunas)
- **Heatmap mensal:** intensidade de gastos por mês (quanto mais vermelho = mais gastou)
- **Top 3 categorias do ano** com valores
- **Mês que mais gastou** destaque
- **Tabela:** Resumo por mês — Entradas | Saídas | Investido | Saldo

---

### 6. Metas Financeiras (`Metas.tsx`)

Cada meta é um card com:
- Nome + emoji/ícone
- Barra de progresso visual (%)
- Valor guardado / Meta total
- "Faltam R$ X"
- Botão "Registrar aporte" → abre mini-form: local + valor + data
- Histórico de aportes ao expandir o card

Layout em grid de cards (2 ou 3 por linha).

**Como funciona:**
1. Usuário cria uma meta com nome e valor total
2. Vai registrando aportes ao longo do tempo
3. Barra de progresso se atualiza

> Exemplo da planilha: "Viagem Chile - Meta: R$ 9.000 | Guardado: R$ 0"

---

### 6.1 Dívidas (`Dividas.tsx`) — módulo adicionado, não previsto no brief original

Espelha o padrão de Metas Financeiras, mas para o lado oposto: em vez de acumular até uma meta, acompanha o abatimento de um valor devido. Rota `/dividas`, item próprio na sidebar.

**Cada dívida é um card com:**
- Descrição + credor (opcional) + categoria
- Badge de status: `Em aberto` (azul) / `Atrasada` (vermelho) / `Quitada` (verde)
- Barra de progresso (pago / total), com aviso se pago > total ("pago a mais" — não bloqueia, só avisa)
- Botão **"Adicionar Pagamento"** → form simples (valor + data + observação livre), sem os campos completos de um lançamento
- Histórico de pagamentos ao expandir, cada um com badge de origem: `Direto` (pago direto no módulo) ou `Fluxos` (veio de um lançamento vinculado)
- CRUD completo (criar/editar/excluir) via modal, mesmo padrão visual dos outros formulários

**Integração com Fluxos (bidirecional, sem duplicidade):**
1. **Pagamento direto no módulo de Dívidas** → gera automaticamente um lançamento espelho (saída) em Fluxos, marcado com `dividaId` + `origemDivida: 'direto_no_modulo'`. Excluir o pagamento no módulo cascade-deleta o lançamento espelho; excluir o lançamento em Fluxos cascade-deleta o registro de pagamento.
2. **Vínculo ao criar uma despesa em Fluxos** → campo opcional "Vincular a uma dívida" no formulário de lançamento (só na criação, não paga em parcelas). Cria um `PagamentoDivida` com `origem: 'via_fluxo'`. Editar valor/data desse lançamento depois sincroniza de volta o pagamento e recalcula o saldo da dívida.

> Diferente de Metas Financeiras: aportes em Metas **não** geram lançamento espelho em Fluxos. Para Dívidas isso foi uma decisão explícita (para manter os relatórios financeiros gerais consistentes) — não é o mesmo padrão apesar da semelhança visual dos módulos.

**Conversão automática de pendências em dívida:**
Ao abrir o app, toda despesa não paga de um mês já encerrado (incluindo gastos fixos e parcelas individuais) é convertida automaticamente em dívida com status `Atrasada`, e o lançamento original é **removido** de Fluxos (a dívida passa a ser o único registro daquele valor). Um banner de aviso mostra quantos itens foram convertidos e quanto, com atalho para `/dividas`. Parcelas da mesma compra parcelada convergem para **uma única** dívida (via `origemLancamentoGrupoId`), em vez de criar um card duplicado por parcela — e uma rotina de limpeza mescla automaticamente duplicatas que porventura já existiam de execuções anteriores a essa correção.

---

### 7. Investimentos FII (`Investimentos.tsx`)

**Seção principal — Carteira de FIIs:**
- Tabela: Ticker | Qtd | Preço Médio | Setor | Corretora
- Botão "Adicionar FII"
- Total investido em FIIs

**Seção de dividendos:**
- Por mês: qual FII pagou quanto
- Total de dividendos recebidos no mês/ano

**Reserva de emergência:**
- Quanto tem guardado
- Meta da reserva (3x, 6x, 12x os gastos fixos)
- Barra de progresso

> Esta seção é simples e manual — o usuário registra os dados, o sistema não consulta APIs externas.

---

### 8. Gamificação 🎮

Objetivo: manter o hábito de registrar gastos regularmente.

**Sistema de XP:**
| Ação | XP ganho |
|------|----------|
| Registrar um lançamento | +10 XP |
| Registrar em 3 dias seguidos | +50 XP (bônus streak) |
| Fechar o mês com saldo positivo | +100 XP |
| Atingir uma meta | +200 XP |
| Registrar todos gastos fixos do mês | +30 XP |

**Níveis:**
- Nível 1: Iniciante Financeiro (0-200 XP)
- Nível 2: Controlador (200-500 XP)
- Nível 3: Organizado (500-1000 XP)
- Nível 4: Investidor (1000-2000 XP)
- Nível 5: Mestre das Finanças (2000+ XP)

**Streak de dias:** contador de dias consecutivos que registrou pelo menos 1 lançamento (exibir na sidebar)

**Conquistas (badges):**
- 🔥 "Primeira semana" — 7 dias de streak
- 💰 "Mês no azul" — saldo positivo em 1 mês
- 🎯 "Meta batida" — atingiu primeira meta
- 🏦 "FII Lover" — cadastrou primeiro FII
- 📊 "Organizador" — registrou gastos fixos do mês

**Widget de gamificação** (no topo ou sidebar):
```
⚡ Nível 3 — Organizado
████████░░ 780/1000 XP
🔥 5 dias seguidos!
```

---

### 9. Acompanhamento Semanal

No dashboard mensal, exibir o mês dividido em semanas:
- **Semana 1:** R$ 450 gastos | R$ 0 receitas
- **Semana 2:** R$ 320 gastos | R$ 500 receitas (salário)
- etc.

Mini-gráfico de barras semanal para visualizar picos de gasto.

---

### 10. Configurações (`Configuracoes.tsx`)

Página acessível pelo ícone de engrenagem na sidebar. Permite ao usuário personalizar completamente o sistema sem tocar em código. Todas as configurações ficam persistidas no IndexedDB na tabela `configuracoes`.

---

#### 10.1 Categorias

Lista editável de categorias. Cada categoria tem:

```typescript
interface Categoria {
  id?: number;
  nome: string;
  tipo: 'despesa' | 'receita' | 'ambos'; // onde aparece no formulário
  emoji: string;                          // ícone visual
  cor: string;                            // hex, usada nos gráficos
  ativa: boolean;
  ordem: number;                          // drag-and-drop para reordenar
}
```

**Interface:**
- Lista de categorias com chips coloridos (nome + emoji + cor)
- Botão **"+ Nova categoria"** → abre inline form: nome | emoji | cor (color picker) | tipo
- Botão de editar (lápis) em cada item
- Toggle de ativar/desativar (categorias inativas somem do formulário de lançamento, mas lançamentos antigos que a usaram continuam íntegros)
- Botão de excluir — só permitido se nenhum lançamento usa aquela categoria; caso contrário, mostrar alerta: _"Existem X lançamentos com essa categoria. Desative-a em vez de excluir."_
- Drag-and-drop para reordenar (usar `@dnd-kit/sortable`)

**Categorias padrão pré-carregadas** (seed no primeiro uso):

| Nome | Emoji | Tipo | Cor |
|------|-------|------|-----|
| Moradia | 🏠 | despesa | #6366f1 |
| Alimentação | 🍽️ | despesa | #f97316 |
| Mercado | 🛒 | despesa | #84cc16 |
| Carro/Gasolina | 🚗 | despesa | #64748b |
| Contas | 📄 | despesa | #0ea5e9 |
| Saúde | 💊 | despesa | #ec4899 |
| Educação | 📚 | despesa | #8b5cf6 |
| Lazer | 🎬 | despesa | #f59e0b |
| Assinaturas | 📱 | despesa | #14b8a6 |
| Presentes | 🎁 | despesa | #e879f9 |
| Roupas | 👕 | despesa | #fb7185 |
| Viagem | ✈️ | despesa | #38bdf8 |
| Beleza | 💅 | despesa | #f472b6 |
| Transporte | 🚌 | despesa | #a3a3a3 |
| Transferências | 🔄 | despesa | #71717a |
| Mimos | 🧸 | despesa | #fbbf24 |
| Imprevistos | ⚠️ | despesa | #dc2626 |
| Salário | 💼 | receita | #22c55e |
| Renda Extra | 💡 | receita | #4ade80 |
| Dividendos FII | 🏦 | receita | #34d399 |
| Outros | 📦 | ambos | #94a3b8 |

> **Importante:** `Categoria` no resto do código deixa de ser um `type` fixo e passa a ser uma `string` dinâmica lida do banco. O formulário de lançamento carrega as categorias ativas do IndexedDB.

---

#### 10.2 Formas de Pagamento

Lista editável de formas de pagamento. Cada uma tem:

```typescript
interface FormaPagamento {
  id?: number;
  nome: string;                    // ex: "Nubank", "Inter", "Pix"
  tipo: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto' | 'vale' | 'outro';
  emoji: string;
  ativa: boolean;
  ordem: number;
}
```

**Interface:** mesma mecânica das categorias — lista com chips, botão de adicionar, editar, ativar/desativar, reordenar.

**Formas padrão pré-carregadas:**

| Nome | Tipo | Emoji |
|------|------|-------|
| Cartão de Crédito 1 | credito | 💳 |
| Cartão de Crédito 2 | credito | 💳 |
| Cartão de Crédito 3 | credito | 💳 |
| Débito | debito | 💰 |
| Pix | pix | 💸 |
| Alelo | vale | 🍽️ |
| Dinheiro | dinheiro | 🪙 |
| Boleto | boleto | 🧾 |

> O usuário pode renomear "Cartão de Crédito 1" para "Nubank", "Cartão de Crédito 2" para "Inter", etc.

> **Lógica de faturas:** todo item com `tipo = 'credito'` aparece automaticamente na tabela de faturas do dashboard mensal. Essa associação é pelo tipo, não pelo nome.

---

#### 10.3 Nomes dos Cartões

Dentro da seção de Formas de Pagamento (ou sub-seção separada), permitir renomear os cartões de crédito para nomes reais. Ex: "Cartão de Crédito 1" → "Nubank Roxinho". Isso aparece nos labels do dashboard de faturas.

---

#### 10.4 Preferências Gerais

```typescript
interface Preferencias {
  tema: 'claro' | 'escuro' | 'sistema';
  moedaSimbolo: string;             // default: "R$"
  diaFechamentoFatura: number;      // 1-28, para calcular a qual mês a fatura pertence
  diaVencimentoFatura: number;      // alerta antes do vencimento
  nomeUsuario: string;              // exibido no header ("Olá, Alexandre 👋")
  avatarEmoji: string;              // emoji de avatar no header
  notificacaoGastosFixos: boolean;  // mostrar alerta no início do mês
  diasAntecedenciaNotificacao: number; // com quantos dias de antecedência avisar
}
```

**Interface:** formulário simples com campos e toggles.

---

#### 10.5 Backup e Restauração

Seção dedicada para exportar e importar os dados:

**Exportar:**
- Botão **"Exportar tudo (JSON)"** → baixa arquivo `financeiro-backup-YYYY-MM-DD.json` com todos os dados do IndexedDB
- Botão **"Exportar mês atual (CSV)"** → baixa planilha do mês para abrir no Excel/Google Sheets

**Importar:**
- Input de arquivo `.json` → restaura todos os dados (com confirmação: _"Isso irá substituir todos os dados atuais. Tem certeza?"_)
- Suporte a importar CSV da planilha original (se implementado)

---

#### 10.6 Resetar Dados

Botão vermelho **"Apagar todos os dados"** com dupla confirmação (digitar "CONFIRMAR" em um input antes de permitir). Útil para recomeçar do zero.

---

#### Estrutura de componentes da página de Configurações

```
pages/
└── Configuracoes.tsx           # página principal com abas
components/
└── Configuracoes/
    ├── AbaCategoria.tsx         # lista + CRUD de categorias
    ├── AbaFormasPagamento.tsx   # lista + CRUD de formas de pagamento
    ├── AbaPreferencias.tsx      # tema, nome, notificações
    └── AbaBackup.tsx            # exportar / importar / resetar
```

A página usa abas horizontais no topo: **Categorias | Formas de Pagamento | Preferências | Backup**

---

#### Tabelas no IndexedDB (Dexie)

> ⚠️ **Desatualizado:** o snippet abaixo é o schema original da versão 1. O schema real evoluiu até a **versão 4** (migrações incrementais no Dexie, cada uma só redeclarando as tabelas que mudaram). Para o schema exato e atual, ler `financeiro/src/db/database.ts` diretamente — é a fonte de verdade, não este arquivo. Resumo das versões:
> - **v1:** schema inicial (abaixo)
> - **v2:** adiciona índice `nome` em `categorias`/`formasPagamento`; adiciona índice `data` em `lancamentos`
> - **v3:** adiciona tabelas `dividas` e `pagamentosDivida`; adiciona índices `dividaId`, `pagamentoDividaId` em `lancamentos`
> - **v4:** adiciona índice `origemLancamentoGrupoId` em `dividas`

```typescript
// Schema original (versão 1) — ver nota acima
db.version(1).stores({
  lancamentos:    '++id, tipo, mes, ano, categoria, formaPagamento, gastoFixo, parcelado, lancamentoPaiId',
  metas:          '++id, ativa',
  aportesMeta:    '++id, metaId',
  fiis:           '++id, ticker',
  dividendosFII:  '++id, fiiId, mes, ano',
  gastosFixos:    '++id, ativo',
  gamificacao:    '++id',
  categorias:     '++id, tipo, ativa, ordem',     // NOVO
  formasPagamento:'++id, tipo, ativa, ordem',     // NOVO
  preferencias:   '++id',                         // NOVO (apenas 1 registro)
});
```

#### Seed inicial (primeiro uso)

No `App.tsx` ou em um hook `useSetupInicial`, verificar se o banco está vazio e popular com os dados padrão de categorias e formas de pagamento. Isso garante que na primeira abertura o sistema já funciona sem configuração manual.

---

## Comportamentos Importantes

### Parcelas automáticas
Ao salvar um gasto parcelado em X vezes:
1. Criar lançamento da parcela 1 na data selecionada
2. Criar automaticamente parcelas 2, 3... N nos meses seguintes (mesmo dia do mês)
3. Todos com `lancamentoPaiId` apontando para o lançamento original
4. Exibir badge `"2/6"` em cada parcela na listagem

### Gastos fixos
- Cadastro separado de template de gastos fixos
- No início de cada mês, sistema pergunta se quer lançar os fixos
- Permite personalizar quais lançar antes de confirmar

### Faturas de cartão
- Somar automaticamente todos os lançamentos de cada cartão de crédito no mês
- Exibir total por cartão
- Checkbox "Pago" — faturas não pagas não saem do saldo (igual à planilha original)

---

## Design e UX

**Paleta de cores sugerida:**
- Verde: `#22c55e` (receitas, positivo)
- Vermelho: `#ef4444` (despesas, negativo)
- Azul: `#3b82f6` (saldo, neutro)
- Roxo: `#8b5cf6` (investimentos, metas)
- Fundo: tema escuro ou claro (deixar configurável)

**Fontes:** Inter ou similar (sans-serif limpa)

**Responsividade:** priorizar desktop (uso local), mas garantir que funcione em mobile para uso futuro

**Idioma:** totalmente em português brasileiro (pt-BR)

**Formatação monetária:** sempre `R$ 1.234,56` (padrão brasileiro)

**Datas:** sempre no formato `dd/mm/yyyy`

---

## Comandos para Iniciar

```bash
npm create vite@latest financeiro -- --template react-ts
cd financeiro
npm install
npm install tailwindcss @tailwindcss/vite
npm install recharts
npm install dexie dexie-react-hooks
npm install react-router-dom
npm install lucide-react
npm install date-fns
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm run dev
```

---

## Ordem de Desenvolvimento Sugerida

1. **Setup inicial:** Vite + React + TypeScript + Tailwind + Recharts + Dexie
2. **Modelo de dados:** Criar schema completo do banco no `database.ts` (incluindo `categorias`, `formasPagamento`, `preferencias`)
3. **Seed inicial:** Popular banco com categorias e formas de pagamento padrão no primeiro uso (`useSetupInicial`)
4. **Configurações — Categorias e Formas de Pagamento:** implementar antes do formulário de lançamento, pois ele depende dos dados dinâmicos
5. **Formulário de Lançamento:** usando `useConfiguracoes` para carregar categorias/pagamentos do banco
6. **Lista de Lançamentos:** com filtros básicos por mês
7. **Dashboard Mensal:** cards + gráficos
8. **Parcelas automáticas:** lógica de criação automática
9. **Gastos fixos + notificação mensal**
10. **Metas financeiras**
11. **Resumo anual**
12. **Investimentos FII**
13. **Configurações — Preferências + Backup**
14. **Gamificação**
15. **Acompanhamento semanal**
16. **Polimento de UI/UX**

---

## Observações Finais

- Tudo funciona **100% offline** via IndexedDB (Dexie) — sem servidor necessário
- Para exportar dados: implementar função de backup em JSON
- Para migrar para nuvem futuramente: trocar Dexie por chamadas REST para um backend Express + PostgreSQL — a interface React não muda
- Não usar localStorage para dados financeiros (limite de 5MB) — usar sempre IndexedDB via Dexie
- O Claude Code pode usar a API da Anthropic embutida caso queira adicionar um assistente de IA para dicas financeiras no futuro

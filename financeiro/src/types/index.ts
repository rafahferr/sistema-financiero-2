export interface Lancamento {
  id?: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  data: string;
  categoria: string;
  valor: number;
  formaPagamento: string;
  parcelado: boolean;
  numeroParcelas?: number;
  parcelaAtual?: number;
  totalParcelas?: number;
  lancamentoPaiId?: number;
  gastoFixo: boolean;
  pago: boolean;
  mes: number;
  ano: number;
  dividaId?: number;
  pagamentoDividaId?: number;
  origemDivida?: 'direto_no_modulo' | 'via_fluxo';
}

export interface Meta {
  id?: number;
  nome: string;
  valorTotal: number;
  valorGuardado: number;
  cor?: string;
  emoji?: string;
  ativa: boolean;
}

export interface AporteMeta {
  id?: number;
  metaId: number;
  data: string;
  local: string;
  valor: number;
}

export interface Divida {
  id?: number;
  descricao: string;
  credor?: string;
  valorTotal: number;
  valorPago: number;
  dataContracao: string;
  dataVencimento?: string;
  numeroParcelas?: number;
  valorParcela?: number;
  categoria?: string;
  status: 'em_aberto' | 'quitada' | 'atrasada';
  observacoes?: string;
  origemLancamentoGrupoId?: number;
}

export interface PagamentoDivida {
  id?: number;
  dividaId: number;
  valor: number;
  data: string;
  origem: 'direto_no_modulo' | 'via_fluxo';
  fluxoId?: number;
  lancamentoEspelhoId?: number;
  observacao?: string;
}

export interface FII {
  id?: number;
  ticker: string;
  quantidade: number;
  precoMedio: number;
  dataCompra: string;
  corretora: string;
  setor?: string;
}

export interface DividendoFII {
  id?: number;
  fiiId: number;
  mes: number;
  ano: number;
  valorTotal: number;
}

export interface GastoFixo {
  id?: number;
  descricao: string;
  categoria: string;
  valor: number;
  formaPagamento: string;
  ativo: boolean;
}

export interface GamificacaoState {
  id?: number;
  xp: number;
  nivel: number;
  streakDias: number;
  ultimoRegistro: string;
  conquistas: string[];
}

export interface Categoria {
  id?: number;
  nome: string;
  tipo: 'despesa' | 'receita' | 'ambos';
  emoji: string;
  cor: string;
  ativa: boolean;
  ordem: number;
}

export interface FormaPagamento {
  id?: number;
  nome: string;
  tipo: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto' | 'vale' | 'outro';
  emoji: string;
  ativa: boolean;
  ordem: number;
}

export interface Preferencias {
  id?: number;
  tema: 'claro' | 'escuro' | 'sistema';
  moedaSimbolo: string;
  diaFechamentoFatura: number;
  diaVencimentoFatura: number;
  nomeUsuario: string;
  avatarEmoji: string;
  notificacaoGastosFixos: boolean;
  diasAntecedenciaNotificacao: number;
}

export type NivelGamificacao = {
  nivel: number;
  nome: string;
  xpMin: number;
  xpMax: number;
};

export const NIVEIS: NivelGamificacao[] = [
  { nivel: 1, nome: 'Iniciante Financeiro', xpMin: 0, xpMax: 200 },
  { nivel: 2, nome: 'Controlador', xpMin: 200, xpMax: 500 },
  { nivel: 3, nome: 'Organizado', xpMin: 500, xpMax: 1000 },
  { nivel: 4, nome: 'Investidor', xpMin: 1000, xpMax: 2000 },
  { nivel: 5, nome: 'Mestre das Finanças', xpMin: 2000, xpMax: 9999 },
];

export const CONQUISTAS = [
  { id: 'primeira_semana', nome: 'Primeira Semana', emoji: '🔥', descricao: '7 dias de streak' },
  { id: 'mes_no_azul', nome: 'Mês no Azul', emoji: '💰', descricao: 'Saldo positivo em 1 mês' },
  { id: 'meta_batida', nome: 'Meta Batida', emoji: '🎯', descricao: 'Atingiu primeira meta' },
  { id: 'fii_lover', nome: 'FII Lover', emoji: '🏦', descricao: 'Cadastrou primeiro FII' },
  { id: 'organizador', nome: 'Organizador', emoji: '📊', descricao: 'Registrou gastos fixos do mês' },
];

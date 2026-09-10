import { useEffect, useRef } from 'react';
import { db } from '../db/database';
import type { Categoria, FormaPagamento, Preferencias } from '../types';

const CATEGORIAS_SEED: Omit<Categoria, 'id'>[] = [
  { nome: 'Moradia',        tipo: 'despesa', emoji: '🏠', cor: '#6366f1', ativa: true, ordem: 1 },
  { nome: 'Alimentação',    tipo: 'despesa', emoji: '🍽️', cor: '#f97316', ativa: true, ordem: 2 },
  { nome: 'Mercado',        tipo: 'despesa', emoji: '🛒', cor: '#84cc16', ativa: true, ordem: 3 },
  { nome: 'Carro/Gasolina', tipo: 'despesa', emoji: '🚗', cor: '#64748b', ativa: true, ordem: 4 },
  { nome: 'Contas',         tipo: 'despesa', emoji: '📄', cor: '#0ea5e9', ativa: true, ordem: 5 },
  { nome: 'Saúde',          tipo: 'despesa', emoji: '💊', cor: '#ec4899', ativa: true, ordem: 6 },
  { nome: 'Educação',       tipo: 'despesa', emoji: '📚', cor: '#8b5cf6', ativa: true, ordem: 7 },
  { nome: 'Lazer',          tipo: 'despesa', emoji: '🎬', cor: '#f59e0b', ativa: true, ordem: 8 },
  { nome: 'Assinaturas',    tipo: 'despesa', emoji: '📱', cor: '#14b8a6', ativa: true, ordem: 9 },
  { nome: 'Presentes',      tipo: 'despesa', emoji: '🎁', cor: '#e879f9', ativa: true, ordem: 10 },
  { nome: 'Roupas',         tipo: 'despesa', emoji: '👕', cor: '#fb7185', ativa: true, ordem: 11 },
  { nome: 'Viagem',         tipo: 'despesa', emoji: '✈️', cor: '#38bdf8', ativa: true, ordem: 12 },
  { nome: 'Beleza',         tipo: 'despesa', emoji: '💅', cor: '#f472b6', ativa: true, ordem: 13 },
  { nome: 'Transporte',     tipo: 'despesa', emoji: '🚌', cor: '#a3a3a3', ativa: true, ordem: 14 },
  { nome: 'Transferências', tipo: 'despesa', emoji: '🔄', cor: '#71717a', ativa: true, ordem: 15 },
  { nome: 'Mimos',          tipo: 'despesa', emoji: '🧸', cor: '#fbbf24', ativa: true, ordem: 16 },
  { nome: 'Imprevistos',    tipo: 'despesa', emoji: '⚠️', cor: '#dc2626', ativa: true, ordem: 17 },
  { nome: 'Salário',        tipo: 'receita', emoji: '💼', cor: '#22c55e', ativa: true, ordem: 18 },
  { nome: 'Renda Extra',    tipo: 'receita', emoji: '💡', cor: '#4ade80', ativa: true, ordem: 19 },
  { nome: 'Dividendos FII', tipo: 'receita', emoji: '🏦', cor: '#34d399', ativa: true, ordem: 20 },
  { nome: 'Outros',         tipo: 'ambos',   emoji: '📦', cor: '#94a3b8', ativa: true, ordem: 21 },
];

const FORMAS_PAGAMENTO_SEED: Omit<FormaPagamento, 'id'>[] = [
  { nome: 'Cartão de Crédito 1', tipo: 'credito',  emoji: '💳', ativa: true, ordem: 1 },
  { nome: 'Cartão de Crédito 2', tipo: 'credito',  emoji: '💳', ativa: true, ordem: 2 },
  { nome: 'Cartão de Crédito 3', tipo: 'credito',  emoji: '💳', ativa: true, ordem: 3 },
  { nome: 'Débito',              tipo: 'debito',   emoji: '💰', ativa: true, ordem: 4 },
  { nome: 'Pix',                 tipo: 'pix',      emoji: '💸', ativa: true, ordem: 5 },
  { nome: 'Alelo',               tipo: 'vale',     emoji: '🍽️', ativa: true, ordem: 6 },
  { nome: 'Dinheiro',            tipo: 'dinheiro', emoji: '🪙', ativa: true, ordem: 7 },
  { nome: 'Boleto',              tipo: 'boleto',   emoji: '🧾', ativa: true, ordem: 8 },
];

const PREFERENCIAS_SEED: Omit<Preferencias, 'id'> = {
  tema: 'escuro',
  moedaSimbolo: 'R$',
  diaFechamentoFatura: 1,
  diaVencimentoFatura: 10,
  nomeUsuario: 'Usuário',
  avatarEmoji: '👤',
  notificacaoGastosFixos: true,
  diasAntecedenciaNotificacao: 3,
};

async function deduplicar() {
  // Remove duplicatas em categorias (mantém o menor id por nome)
  const cats = await db.categorias.toArray();
  const vistosC = new Map<string, number>();
  const removerC: number[] = [];
  for (const c of cats) {
    if (vistosC.has(c.nome)) {
      removerC.push(c.id!);
    } else {
      vistosC.set(c.nome, c.id!);
    }
  }
  if (removerC.length > 0) await db.categorias.bulkDelete(removerC);

  // Remove duplicatas em formas de pagamento
  const fps = await db.formasPagamento.toArray();
  const vistosFP = new Map<string, number>();
  const removerFP: number[] = [];
  for (const fp of fps) {
    if (vistosFP.has(fp.nome)) {
      removerFP.push(fp.id!);
    } else {
      vistosFP.set(fp.nome, fp.id!);
    }
  }
  if (removerFP.length > 0) await db.formasPagamento.bulkDelete(removerFP);

  // Remove duplicatas em preferências (mantém só o primeiro)
  const prefs = await db.preferencias.toArray();
  if (prefs.length > 1) {
    await db.preferencias.bulkDelete(prefs.slice(1).map(p => p.id!));
  }

  // Remove duplicatas em gamificação
  const gams = await db.gamificacao.toArray();
  if (gams.length > 1) {
    await db.gamificacao.bulkDelete(gams.slice(1).map(g => g.id!));
  }
}

export function useSetupInicial() {
  // useRef evita dupla execução no React StrictMode (que monta componentes 2x em dev)
  const executado = useRef(false);

  useEffect(() => {
    if (executado.current) return;
    executado.current = true;

    async function setup() {
      // Limpa duplicatas que possam ter ocorrido antes do fix
      await deduplicar();

      const [catCount, fpCount, prefCount] = await Promise.all([
        db.categorias.count(),
        db.formasPagamento.count(),
        db.preferencias.count(),
      ]);

      if (catCount === 0) {
        await db.categorias.bulkAdd(CATEGORIAS_SEED as Categoria[]);
      }
      if (fpCount === 0) {
        await db.formasPagamento.bulkAdd(FORMAS_PAGAMENTO_SEED as FormaPagamento[]);
      }
      if (prefCount === 0) {
        await db.preferencias.add(PREFERENCIAS_SEED as Preferencias);
      }

      const gamCount = await db.gamificacao.count();
      if (gamCount === 0) {
        await db.gamificacao.add({
          xp: 0, nivel: 1, streakDias: 0, ultimoRegistro: '', conquistas: [],
        });
      }
    }
    setup();
  }, []);
}

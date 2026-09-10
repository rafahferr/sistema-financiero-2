import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Categoria, FormaPagamento, Preferencias } from '../types';

export function useConfiguracoes() {
  const categorias = useLiveQuery(() =>
    db.categorias.orderBy('ordem').filter(c => c.ativa).toArray()
  ) ?? [];

  const todasCategorias = useLiveQuery(() =>
    db.categorias.orderBy('ordem').toArray()
  ) ?? [];

  const formasPagamento = useLiveQuery(() =>
    db.formasPagamento.orderBy('ordem').filter(f => f.ativa).toArray()
  ) ?? [];

  const todasFormasPagamento = useLiveQuery(() =>
    db.formasPagamento.orderBy('ordem').toArray()
  ) ?? [];

  const preferencias = useLiveQuery(() =>
    db.preferencias.toCollection().first()
  );

  const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos');
  const categoriasReceita = categorias.filter(c => c.tipo === 'receita' || c.tipo === 'ambos');

  async function salvarPreferencias(prefs: Partial<Preferencias>) {
    const existente = await db.preferencias.toCollection().first();
    if (existente?.id) {
      await db.preferencias.update(existente.id, prefs);
    }
  }

  async function adicionarCategoria(cat: Omit<Categoria, 'id'>) {
    await db.categorias.add(cat as Categoria);
  }

  async function editarCategoria(id: number, dados: Partial<Categoria>) {
    await db.categorias.update(id, dados);
  }

  async function removerCategoria(id: number) {
    const usos = await db.lancamentos.where('categoria').equals(
      (await db.categorias.get(id))?.nome ?? ''
    ).count();
    if (usos > 0) throw new Error(`Existem ${usos} lançamentos com essa categoria. Desative-a em vez de excluir.`);
    await db.categorias.delete(id);
  }

  async function adicionarFormaPagamento(fp: Omit<FormaPagamento, 'id'>) {
    await db.formasPagamento.add(fp as FormaPagamento);
  }

  async function editarFormaPagamento(id: number, dados: Partial<FormaPagamento>) {
    await db.formasPagamento.update(id, dados);
  }

  async function removerFormaPagamento(id: number) {
    const fp = await db.formasPagamento.get(id);
    const usos = await db.lancamentos.where('formaPagamento').equals(fp?.nome ?? '').count();
    if (usos > 0) throw new Error(`Existem ${usos} lançamentos com essa forma de pagamento.`);
    await db.formasPagamento.delete(id);
  }

  return {
    categorias,
    todasCategorias,
    categoriasDespesa,
    categoriasReceita,
    formasPagamento,
    todasFormasPagamento,
    preferencias,
    salvarPreferencias,
    adicionarCategoria,
    editarCategoria,
    removerCategoria,
    adicionarFormaPagamento,
    editarFormaPagamento,
    removerFormaPagamento,
  };
}

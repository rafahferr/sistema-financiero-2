import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { FII, DividendoFII } from '../types';
import { useGamificacao } from './useGamificacao';

export function useFIIs() {
  const { desbloquearConquista } = useGamificacao();

  const fiis = useLiveQuery(() => db.fiis.toArray()) ?? [];
  const todosDividendos = useLiveQuery(() => db.dividendosFII.toArray()) ?? [];

  async function adicionarFII(dados: Omit<FII, 'id'>) {
    await db.fiis.add(dados as FII);
    const count = await db.fiis.count();
    if (count === 1) await desbloquearConquista('fii_lover');
  }

  async function editarFII(id: number, dados: Partial<FII>) {
    await db.fiis.update(id, dados);
  }

  async function removerFII(id: number) {
    await db.dividendosFII.where('fiiId').equals(id).delete();
    await db.fiis.delete(id);
  }

  async function adicionarDividendo(dados: Omit<DividendoFII, 'id'>) {
    await db.dividendosFII.add(dados as DividendoFII);
  }

  async function editarDividendo(id: number, dados: Partial<DividendoFII>) {
    await db.dividendosFII.update(id, dados);
  }

  async function removerDividendo(id: number) {
    await db.dividendosFII.delete(id);
  }

  function getDividendosPorMesAno(mes: number, ano: number) {
    return todosDividendos.filter(d => d.mes === mes && d.ano === ano);
  }

  const totalInvestido = fiis.reduce((s, f) => s + f.quantidade * f.precoMedio, 0);

  return {
    fiis,
    dividendos: todosDividendos,
    totalInvestido,
    adicionarFII,
    editarFII,
    removerFII,
    adicionarDividendo,
    editarDividendo,
    removerDividendo,
    getDividendosPorMesAno,
  };
}

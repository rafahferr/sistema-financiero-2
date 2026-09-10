import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { GastoFixo, Lancamento } from '../types';
import { format } from 'date-fns';
import { useGamificacao } from './useGamificacao';

export function useGastosFixos() {
  const { registrarAcao, desbloquearConquista } = useGamificacao();

  const gastosFixos = useLiveQuery(() =>
    db.gastosFixos.filter(g => g.ativo).toArray()
  ) ?? [];

  async function adicionarGastoFixo(dados: Omit<GastoFixo, 'id'>) {
    await db.gastosFixos.add(dados as GastoFixo);
  }

  async function editarGastoFixo(id: number, dados: Partial<GastoFixo>) {
    await db.gastosFixos.update(id, dados);
  }

  async function removerGastoFixo(id: number) {
    await db.gastosFixos.delete(id);
  }

  async function lancarGastosFixos(mes: number, ano: number, ids?: number[]) {
    const gastosParaLancar = ids
      ? gastosFixos.filter(g => g.id !== undefined && ids.includes(g.id))
      : gastosFixos;

    const hoje = format(new Date(ano, mes - 1, 1), 'yyyy-MM-dd');

    for (const gasto of gastosParaLancar) {
      await db.lancamentos.add({
        tipo: 'despesa',
        descricao: gasto.descricao,
        data: hoje,
        categoria: gasto.categoria,
        valor: gasto.valor,
        formaPagamento: gasto.formaPagamento,
        parcelado: false,
        gastoFixo: true,
        pago: false,
        mes,
        ano,
      } as Lancamento);
    }

    await registrarAcao('gastos_fixos');
    await desbloquearConquista('organizador');
  }

  return {
    gastosFixos,
    adicionarGastoFixo,
    editarGastoFixo,
    removerGastoFixo,
    lancarGastosFixos,
  };
}

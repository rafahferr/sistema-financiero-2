import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Lancamento } from '../types';
import { addMonths, format } from 'date-fns';
import { useGamificacao } from './useGamificacao';
import { criarPagamentoViaFluxo, atualizarPagamentoDeFluxo, removerPagamentoDivida } from './useDividas';

export function useLancamentos(mes?: number, ano?: number) {
  const { registrarAcao } = useGamificacao();

  const lancamentos = useLiveQuery(() => {
    if (mes !== undefined && ano !== undefined) {
      return db.lancamentos
        .where('[mes+ano]').equals([mes, ano])
        .toArray()
        .then(arr => arr.sort((a, b) => b.data.localeCompare(a.data)));
    }
    return db.lancamentos.toArray()
      .then(arr => arr.sort((a, b) => b.data.localeCompare(a.data)));
  }, [mes, ano]) ?? [];

  const todosLancamentos = useLiveQuery(() =>
    db.lancamentos.toArray()
      .then(arr => arr.sort((a, b) => b.data.localeCompare(a.data)))
  ) ?? [];

  async function adicionarLancamento(dados: Omit<Lancamento, 'id'>) {
    if (dados.parcelado && dados.numeroParcelas && dados.numeroParcelas > 1) {
      const paiId = await db.lancamentos.add({
        ...dados,
        parcelaAtual: 1,
        totalParcelas: dados.numeroParcelas,
      } as Lancamento);

      for (let i = 2; i <= dados.numeroParcelas; i++) {
        // 'T00:00:00' força horário local — sem isso a data é lida como UTC e cai um dia antes
        const dataBase = new Date(dados.data + 'T00:00:00');
        const dataFutura = addMonths(dataBase, i - 1);
        const mesF = dataFutura.getMonth() + 1;
        const anoF = dataFutura.getFullYear();
        await db.lancamentos.add({
          ...dados,
          data: format(dataFutura, 'yyyy-MM-dd'),
          mes: mesF,
          ano: anoF,
          parcelaAtual: i,
          totalParcelas: dados.numeroParcelas,
          lancamentoPaiId: paiId as number,
        } as Lancamento);
      }
    } else {
      const novoId = await db.lancamentos.add({ ...dados, parcelado: false } as Lancamento);
      if (dados.tipo === 'despesa' && dados.dividaId) {
        const pagamentoId = await criarPagamentoViaFluxo(dados.dividaId, dados.valor, dados.data, novoId as number);
        await db.lancamentos.update(novoId as number, { pagamentoDividaId: pagamentoId, origemDivida: 'via_fluxo' });
      }
    }

    await registrarAcao('lancamento');
  }

  async function editarLancamento(id: number, dados: Partial<Lancamento>) {
    await db.lancamentos.update(id, dados);
    const atual = await db.lancamentos.get(id);
    if (atual?.pagamentoDividaId && (dados.valor !== undefined || dados.data !== undefined)) {
      await atualizarPagamentoDeFluxo(atual.pagamentoDividaId, atual.valor, atual.data);
    }
  }

  async function excluirLancamento(id: number) {
    const lancamento = await db.lancamentos.get(id);
    if (lancamento?.lancamentoPaiId === undefined && lancamento?.parcelado) {
      await db.lancamentos.where('lancamentoPaiId').equals(id).delete();
    }
    if (lancamento?.pagamentoDividaId) {
      await removerPagamentoDivida(lancamento.pagamentoDividaId, true);
    }
    await db.lancamentos.delete(id);
  }

  async function togglePago(id: number, pago: boolean) {
    await db.lancamentos.update(id, { pago });
  }

  return {
    lancamentos,
    todosLancamentos,
    adicionarLancamento,
    editarLancamento,
    excluirLancamento,
    togglePago,
  };
}

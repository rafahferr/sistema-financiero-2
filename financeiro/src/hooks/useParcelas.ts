import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, format } from 'date-fns';
import { db } from '../db/database';
import type { Lancamento } from '../types';

export interface GrupoParcela {
  grupoId: number;
  descricao: string;
  categoria: string;
  formaPagamento: string;
  tipo: 'receita' | 'despesa';
  valorParcela: number;
  totalParcelas: number;
  parcelas: Lancamento[]; // ordenadas por parcelaAtual
}

function agruparParcelas(lancamentos: Lancamento[]): GrupoParcela[] {
  const porGrupo = new Map<number, Lancamento[]>();
  for (const l of lancamentos) {
    const grupoId = l.lancamentoPaiId ?? l.id!;
    if (!porGrupo.has(grupoId)) porGrupo.set(grupoId, []);
    porGrupo.get(grupoId)!.push(l);
  }

  return Array.from(porGrupo.entries())
    .map(([grupoId, parcelas]) => {
      parcelas.sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1));
      const primeira = parcelas[0];
      return {
        grupoId,
        descricao: primeira.descricao,
        categoria: primeira.categoria,
        formaPagamento: primeira.formaPagamento,
        tipo: primeira.tipo,
        valorParcela: primeira.valor,
        totalParcelas: primeira.totalParcelas ?? parcelas.length,
        parcelas,
      };
    })
    .sort((a, b) => (a.parcelas[0]?.data ?? '').localeCompare(b.parcelas[0]?.data ?? ''));
}

/**
 * Edita campos compartilhados de uma compra parcelada inteira (todas as parcelas do grupo).
 * A data, quando informada, é a data da 1ª parcela — as demais são recalculadas a partir dela
 * mantendo o espaçamento de um mês por parcela (mesma lógica usada ao criar a compra), usando
 * `parcelaAtual` como referência em vez da posição no array, para não desalinhar caso alguma
 * parcela do meio já tenha virado dívida (removida de Fluxos) e não exista mais aqui.
 */
export async function editarGrupoParcela(
  grupoId: number,
  dados: {
    descricao?: string;
    categoria?: string;
    formaPagamento?: string;
    valorParcela?: number;
    dataPrimeiraParcela?: string;
  }
) {
  const todasDoGrupo = await db.lancamentos
    .filter(l => l.parcelado && (l.lancamentoPaiId === grupoId || l.id === grupoId))
    .toArray();

  await db.transaction('rw', db.lancamentos, async () => {
    for (const parcela of todasDoGrupo) {
      const update: Partial<Lancamento> = {};
      if (dados.descricao !== undefined) update.descricao = dados.descricao;
      if (dados.categoria !== undefined) update.categoria = dados.categoria;
      if (dados.formaPagamento !== undefined) update.formaPagamento = dados.formaPagamento;
      if (dados.valorParcela !== undefined) update.valor = dados.valorParcela;

      if (dados.dataPrimeiraParcela !== undefined) {
        const offset = (parcela.parcelaAtual ?? 1) - 1;
        const novaDataBase = new Date(dados.dataPrimeiraParcela + 'T00:00:00');
        const dataParcela = offset === 0 ? novaDataBase : addMonths(novaDataBase, offset);
        update.data = format(dataParcela, 'yyyy-MM-dd');
        update.mes = dataParcela.getMonth() + 1;
        update.ano = dataParcela.getFullYear();
      }

      await db.lancamentos.update(parcela.id!, update);
    }
  });
}

export function useParcelas() {
  const lancamentosParcelados = useLiveQuery(() =>
    db.lancamentos.filter(l => l.parcelado).toArray()
  ) ?? [];

  const grupos = agruparParcelas(lancamentosParcelados);

  async function togglePago(id: number, pago: boolean) {
    await db.lancamentos.update(id, { pago: !pago });
  }

  return { grupos, togglePago };
}

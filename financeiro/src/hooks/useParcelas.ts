import { useLiveQuery } from 'dexie-react-hooks';
import { addMonths, subMonths, format } from 'date-fns';
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

/** Data/mês/ano de uma parcela, a partir da data da 1ª e do número da parcela. */
function datasDaParcela(dataBase: string, numero: number) {
  const base = new Date(dataBase + 'T00:00:00');
  const data = numero === 1 ? base : addMonths(base, numero - 1);
  return { data: format(data, 'yyyy-MM-dd'), mes: data.getMonth() + 1, ano: data.getFullYear() };
}

/**
 * Data da 1ª parcela do grupo. Se a parcela 1 não existir mais (virou dívida), retrocede
 * a partir de qualquer parcela existente usando o número dela.
 */
function dataDaPrimeiraParcela(parcelas: Lancamento[]): string {
  const primeira = parcelas.find(p => (p.parcelaAtual ?? 1) === 1);
  if (primeira) return primeira.data;
  const ref = parcelas[0];
  const offset = (ref.parcelaAtual ?? 1) - 1;
  return format(subMonths(new Date(ref.data + 'T00:00:00'), offset), 'yyyy-MM-dd');
}

/**
 * Edita campos compartilhados de uma compra parcelada inteira (todas as parcelas do grupo).
 * A data é a da 1ª parcela — as demais são recalculadas a partir dela mantendo o espaçamento
 * de um mês por parcela (mesma lógica usada ao criar a compra), usando `parcelaAtual` como
 * referência em vez da posição no array, para não desalinhar caso alguma parcela do meio já
 * tenha virado dívida (removida de Fluxos) e não exista mais aqui.
 *
 * Mudar `totalParcelas` cria as parcelas que faltam no fim (ao aumentar) ou exclui as que
 * passam do novo total (ao diminuir). Parcelas ausentes no meio não são recriadas, já que
 * quem sumiu virou dívida e continua sendo cobrada lá.
 */
export async function editarGrupoParcela(
  grupoId: number,
  dados: {
    descricao?: string;
    categoria?: string;
    formaPagamento?: string;
    valorParcela?: number;
    dataPrimeiraParcela?: string;
    totalParcelas?: number;
  }
) {
  const todasDoGrupo = await db.lancamentos
    .filter(l => l.parcelado && (l.lancamentoPaiId === grupoId || l.id === grupoId))
    .toArray();
  if (todasDoGrupo.length === 0) return;

  todasDoGrupo.sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1));
  const referencia = todasDoGrupo[0];
  const totalAnterior = referencia.totalParcelas ?? todasDoGrupo.length;
  const totalFinal = dados.totalParcelas ?? totalAnterior;
  const valorFinal = dados.valorParcela ?? referencia.valor;
  const dataBase = dados.dataPrimeiraParcela ?? dataDaPrimeiraParcela(todasDoGrupo);

  await db.transaction('rw', db.lancamentos, async () => {
    for (const parcela of todasDoGrupo) {
      const numero = parcela.parcelaAtual ?? 1;

      if (numero > totalFinal) {
        await db.lancamentos.delete(parcela.id!);
        continue;
      }

      await db.lancamentos.update(parcela.id!, {
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.categoria !== undefined && { categoria: dados.categoria }),
        ...(dados.formaPagamento !== undefined && { formaPagamento: dados.formaPagamento }),
        valor: valorFinal,
        numeroParcelas: totalFinal,
        totalParcelas: totalFinal,
        ...datasDaParcela(dataBase, numero),
      });
    }

    for (let numero = totalAnterior + 1; numero <= totalFinal; numero++) {
      await db.lancamentos.add({
        tipo: referencia.tipo,
        descricao: dados.descricao ?? referencia.descricao,
        categoria: dados.categoria ?? referencia.categoria,
        formaPagamento: dados.formaPagamento ?? referencia.formaPagamento,
        valor: valorFinal,
        parcelado: true,
        numeroParcelas: totalFinal,
        parcelaAtual: numero,
        totalParcelas: totalFinal,
        lancamentoPaiId: grupoId,
        gastoFixo: referencia.gastoFixo,
        pago: false,
        ...datasDaParcela(dataBase, numero),
      } as Lancamento);
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

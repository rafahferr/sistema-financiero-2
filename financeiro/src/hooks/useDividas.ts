import { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db/database';
import { dataHoje, mesAtual, anoAtual, mesNome } from '../utils/formatters';
import { datasDaParcela, dataDaPrimeiraParcela } from './useParcelas';
import type { Divida, PagamentoDivida, Lancamento } from '../types';

export async function recalcularDivida(dividaId: number) {
  const divida = await db.dividas.get(dividaId);
  if (!divida?.id) return;

  const pagamentos = await db.pagamentosDivida.where('dividaId').equals(dividaId).toArray();
  const valorPago = pagamentos.reduce((s, p) => s + p.valor, 0);

  // Dívida espelho de atraso: o total é sempre a soma dos lançamentos atrasados ligados a ela,
  // então editar/excluir um lançamento se reflete aqui sozinho. Se não sobrou nenhum lançamento
  // ligado, mantém o último total conhecido em vez de zerar a dívida.
  const atrasados = await db.lancamentos
    .filter(l => l.dividaId === dividaId && l.origemDivida === 'atraso')
    .toArray();
  const valorTotal = atrasados.length > 0
    ? atrasados.reduce((s, l) => s + l.valor, 0)
    : divida.valorTotal;

  const hoje = dataHoje();
  const status: Divida['status'] =
    valorPago >= valorTotal
      ? 'quitada'
      : divida.dataVencimento && divida.dataVencimento < hoje
        ? 'atrasada'
        : 'em_aberto';

  // O plano de parcelas da dívida espelho é quantas parcelas atrasadas ela cobre — não o total
  // de parcelas da compra original, que incluiria parcelas em dia que nem estão nesta dívida.
  const plano = atrasados.length > 0
    ? { numeroParcelas: atrasados.length, valorParcela: valorTotal / atrasados.length }
    : {};

  await db.dividas.update(dividaId, { valorTotal, valorPago, status, ...plano });
}

/**
 * Marca/desmarca um lançamento como pago, sincronizando a dívida quando ele é um
 * lançamento atrasado espelhado por uma (`origemDivida === 'atraso'`): pagar registra
 * um pagamento que abate a dívida, desmarcar devolve o saldo.
 */
export async function marcarLancamentoPago(lancamentoId: number, pago: boolean) {
  const lancamento = await db.lancamentos.get(lancamentoId);
  if (!lancamento) return;

  await db.lancamentos.update(lancamentoId, { pago });

  if (lancamento.origemDivida !== 'atraso' || !lancamento.dividaId) return;

  if (pago && !lancamento.pagamentoDividaId) {
    const pagamentoId = await criarPagamentoViaFluxo(
      lancamento.dividaId, lancamento.valor, lancamento.data, lancamentoId,
    );
    await db.lancamentos.update(lancamentoId, { pagamentoDividaId: pagamentoId });
  } else if (!pago && lancamento.pagamentoDividaId) {
    await removerPagamentoDivida(lancamento.pagamentoDividaId, true);
    await db.lancamentos.update(lancamentoId, { pagamentoDividaId: undefined });
  }
}

/** Cria o registro de pagamento vinculado a um lançamento de Fluxos (origem = via_fluxo). */
export async function criarPagamentoViaFluxo(dividaId: number, valor: number, data: string, fluxoId: number) {
  const pagamentoId = await db.pagamentosDivida.add({
    dividaId, valor, data, origem: 'via_fluxo', fluxoId,
  } as PagamentoDivida);
  await recalcularDivida(dividaId);
  return pagamentoId as number;
}

/** Sincroniza valor/data de um pagamento quando o lançamento de Fluxos vinculado é editado. */
export async function atualizarPagamentoDeFluxo(pagamentoId: number, valor: number, data: string) {
  const pagamento = await db.pagamentosDivida.get(pagamentoId);
  if (!pagamento) return;
  await db.pagamentosDivida.update(pagamentoId, { valor, data });
  await recalcularDivida(pagamento.dividaId);
}

/**
 * Remove um pagamento de dívida e recalcula o saldo.
 * `manterLancamentoEspelho`: usado quando a chamada já parte da exclusão do próprio
 * lançamento espelho em Fluxos, para não tentar excluí-lo de novo (evita recursão).
 */
export async function removerPagamentoDivida(pagamentoId: number, manterLancamentoEspelho = false) {
  const pagamento = await db.pagamentosDivida.get(pagamentoId);
  if (!pagamento) return;

  if (!manterLancamentoEspelho && pagamento.origem === 'direto_no_modulo' && pagamento.lancamentoEspelhoId) {
    await db.lancamentos.delete(pagamento.lancamentoEspelhoId);
  }

  await db.pagamentosDivida.delete(pagamentoId);
  await recalcularDivida(pagamento.dividaId);
}

const PREFIXO_OBS_AUTO = 'Convertido automaticamente';

/**
 * Espelha em dívida toda despesa não paga de um mês já encerrado (mês/ano anterior ao atual).
 * O lançamento **continua existindo** em Fluxos (só ganha `dividaId` + `origemDivida: 'atraso'`):
 * a dívida é um espelho do atraso, e marcar o lançamento como pago abate o saldo dela.
 * Lançamentos já ligados a uma dívida são ignorados, pra não somar duas vezes.
 *
 * Parcelas da mesma compra (mesmo `lancamentoPaiId`, ou o próprio id quando é a parcela "pai") são
 * agrupadas numa única dívida via `origemLancamentoGrupoId`, em vez de criar um card duplicado por parcela.
 */
async function converterPendenciasEmDividas(): Promise<{ convertidos: number; total: number }> {
  const mesRef = mesAtual();
  const anoRef = anoAtual();

  const candidatos = await db.lancamentos
    .where('tipo').equals('despesa')
    .filter(l =>
      !l.pago &&
      !l.dividaId &&
      !l.pagamentoDividaId &&
      (l.ano < anoRef || (l.ano === anoRef && l.mes < mesRef))
    )
    .toArray();

  let total = 0;
  const dividasAfetadas = new Set<number>();

  for (const l of candidatos) {
    const grupoId = l.lancamentoPaiId ?? l.id!;

    await db.transaction('rw', db.dividas, db.lancamentos, async () => {
      const dataVencimento = format(new Date(l.ano, l.mes, 0), 'yyyy-MM-dd');
      const existente = await db.dividas.where('origemLancamentoGrupoId').equals(grupoId).first();
      let dividaId: number;

      if (existente?.id) {
        const vencimentoMaisRecente =
          !existente.dataVencimento || dataVencimento > existente.dataVencimento
            ? dataVencimento
            : existente.dataVencimento;
        await db.dividas.update(existente.id, { dataVencimento: vencimentoMaisRecente });
        dividaId = existente.id;
      } else {
        dividaId = await db.dividas.add({
          descricao: l.descricao,
          valorTotal: l.valor,
          valorPago: 0,
          dataContracao: l.data,
          dataVencimento,
          numeroParcelas: l.totalParcelas,
          valorParcela: l.parcelado ? l.valor : undefined,
          categoria: l.categoria,
          status: 'atrasada',
          origemLancamentoGrupoId: grupoId,
          observacoes: `${PREFIXO_OBS_AUTO} — lançamento "${l.descricao}" de ${mesNome(l.mes)}/${l.ano} não foi pago.`,
        } as Divida) as number;
      }

      dividasAfetadas.add(dividaId);
      await db.lancamentos.update(l.id!, { dividaId, origemDivida: 'atraso' });
    });
    total += l.valor;
  }

  for (const id of dividasAfetadas) {
    await recalcularDivida(id);
  }

  return { convertidos: candidatos.length, total };
}

/**
 * Restaura em Fluxos as parcelas que a conversão antiga apagou ao transformá-las em dívida,
 * agora ligadas à dívida (`origemDivida: 'atraso'`) em vez de substituídas por ela.
 *
 * Só mexe em séries parceladas que ainda têm alguma parcela viva (é dela que vêm descrição,
 * categoria, forma de pagamento e valor) e em dívidas **sem nenhum pagamento registrado** —
 * se já houve pagamento, recriar as parcelas contaria o mesmo dinheiro duas vezes.
 */
async function restaurarParcelasQueViraramDivida(): Promise<number> {
  const dividas = await db.dividas.filter(d => d.origemLancamentoGrupoId !== undefined).toArray();
  let restauradas = 0;

  for (const divida of dividas) {
    const grupoId = divida.origemLancamentoGrupoId!;

    const pagamentos = await db.pagamentosDivida.where('dividaId').equals(divida.id!).count();
    if (pagamentos > 0) continue;

    const sobreviventes = await db.lancamentos
      .filter(l => l.parcelado && (l.lancamentoPaiId === grupoId || l.id === grupoId))
      .toArray();
    if (sobreviventes.length === 0) continue;

    sobreviventes.sort((a, b) => (a.parcelaAtual ?? 1) - (b.parcelaAtual ?? 1));
    const referencia = sobreviventes[0];
    const totalParcelas = referencia.totalParcelas ?? sobreviventes.length;
    const existentes = new Set(sobreviventes.map(l => l.parcelaAtual ?? 1));

    const faltando: number[] = [];
    for (let n = 1; n <= totalParcelas; n++) if (!existentes.has(n)) faltando.push(n);
    if (faltando.length === 0) continue;

    const dataBase = dataDaPrimeiraParcela(sobreviventes);

    await db.transaction('rw', db.lancamentos, async () => {
      for (const numero of faltando) {
        await db.lancamentos.add({
          tipo: referencia.tipo,
          descricao: referencia.descricao,
          categoria: referencia.categoria,
          formaPagamento: referencia.formaPagamento,
          valor: referencia.valor,
          parcelado: true,
          numeroParcelas: totalParcelas,
          parcelaAtual: numero,
          totalParcelas,
          lancamentoPaiId: grupoId,
          gastoFixo: referencia.gastoFixo,
          pago: false,
          dividaId: divida.id,
          origemDivida: 'atraso',
          ...datasDaParcela(dataBase, numero),
        } as Lancamento);
        restauradas++;
      }
    });

    await recalcularDivida(divida.id!);
  }

  return restauradas;
}

/**
 * Mescla dívidas duplicadas geradas pela conversão automática antes desta correção
 * (uma por parcela em vez de uma por compra parcelada). Só mexe em dívidas cuja
 * `observacoes` comprova que vieram da conversão automática — nunca em dívidas criadas manualmente,
 * mesmo que tenham descrição parecida.
 */
async function mesclarDividasConvertidasDuplicadas(): Promise<number> {
  const todas = await db.dividas.toArray();
  const autoConvertidas = todas.filter(d => d.observacoes?.startsWith(PREFIXO_OBS_AUTO));

  const grupos = new Map<string, Divida[]>();
  for (const d of autoConvertidas) {
    const chave = `${d.descricao}::${d.categoria ?? ''}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(d);
  }

  let mesclados = 0;

  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    grupo.sort((a, b) => a.id! - b.id!);
    const [keeper, ...losers] = grupo;

    await db.transaction('rw', db.dividas, db.pagamentosDivida, async () => {
      let valorTotalSomado = keeper.valorTotal;
      for (const loser of losers) {
        await db.pagamentosDivida.where('dividaId').equals(loser.id!).modify({ dividaId: keeper.id! });
        valorTotalSomado += loser.valorTotal;
        await db.dividas.delete(loser.id!);
        mesclados++;
      }
      await db.dividas.update(keeper.id!, { valorTotal: valorTotalSomado });
    });

    await recalcularDivida(keeper.id!);
  }

  return mesclados;
}

/** Roda as limpezas e o espelhamento de atrasos uma única vez por carregamento do app. */
export function useConversaoAutomaticaDividas() {
  const [resultado, setResultado] = useState<
    { convertidos: number; total: number; mesclados: number; restauradas: number } | null
  >(null);
  const executado = useRef(false);

  useEffect(() => {
    if (executado.current) return;
    executado.current = true;
    (async () => {
      const mesclados = await mesclarDividasConvertidasDuplicadas();
      const restauradas = await restaurarParcelasQueViraramDivida();
      const { convertidos, total } = await converterPendenciasEmDividas();
      if (convertidos > 0 || mesclados > 0 || restauradas > 0) {
        setResultado({ convertidos, total, mesclados, restauradas });
      }
    })();
  }, []);

  return resultado;
}

export function useDividas() {
  const dividas = useLiveQuery(() => db.dividas.toArray()) ?? [];
  const pagamentos = useLiveQuery(() => db.pagamentosDivida.toArray()) ?? [];

  async function adicionarDivida(dados: Omit<Divida, 'id' | 'valorPago' | 'status'>) {
    await db.dividas.add({ ...dados, valorPago: 0, status: 'em_aberto' } as Divida);
  }

  async function editarDivida(id: number, dados: Partial<Divida>) {
    await db.dividas.update(id, dados);
    await recalcularDivida(id);
  }

  async function excluirDivida(id: number) {
    const pagamentosDaDivida = await db.pagamentosDivida.where('dividaId').equals(id).toArray();
    for (const p of pagamentosDaDivida) {
      if (p.origem === 'direto_no_modulo' && p.lancamentoEspelhoId) {
        await db.lancamentos.delete(p.lancamentoEspelhoId);
      }
    }
    await db.pagamentosDivida.where('dividaId').equals(id).delete();
    await db.dividas.delete(id);
  }

  /** Pagamento livre feito direto no módulo de Dívidas — gera lançamento espelho (saída) em Fluxos. */
  async function adicionarPagamento(dividaId: number, valor: number, data: string, observacao?: string) {
    const divida = await db.dividas.get(dividaId);
    if (!divida?.id) return;

    const dataObj = new Date(data + 'T00:00:00');
    const lancamentoId = await db.lancamentos.add({
      tipo: 'despesa',
      descricao: `Pagamento — ${divida.descricao}`,
      data,
      categoria: divida.categoria || 'Outros',
      valor,
      formaPagamento: 'Dinheiro',
      parcelado: false,
      gastoFixo: false,
      pago: true,
      mes: dataObj.getMonth() + 1,
      ano: dataObj.getFullYear(),
      dividaId,
      origemDivida: 'direto_no_modulo',
    } as Lancamento);

    const pagamentoId = await db.pagamentosDivida.add({
      dividaId,
      valor,
      data,
      origem: 'direto_no_modulo',
      lancamentoEspelhoId: lancamentoId as number,
      observacao,
    } as PagamentoDivida);

    await db.lancamentos.update(lancamentoId as number, { pagamentoDividaId: pagamentoId as number });
    await recalcularDivida(dividaId);
  }

  async function removerPagamento(id: number) {
    await removerPagamentoDivida(id);
  }

  function getPagamentosDaDivida(dividaId: number) {
    return pagamentos
      .filter(p => p.dividaId === dividaId)
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  return {
    dividas,
    pagamentos,
    adicionarDivida,
    editarDivida,
    excluirDivida,
    adicionarPagamento,
    removerPagamento,
    getPagamentosDaDivida,
  };
}

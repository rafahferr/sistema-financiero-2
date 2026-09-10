import Dexie, { type EntityTable } from 'dexie';
import type {
  Lancamento, Meta, AporteMeta, FII, DividendoFII,
  GastoFixo, GamificacaoState, Categoria, FormaPagamento, Preferencias,
  Divida, PagamentoDivida,
} from '../types';

class FinanceiroDatabase extends Dexie {
  lancamentos!: EntityTable<Lancamento, 'id'>;
  metas!: EntityTable<Meta, 'id'>;
  aportesMeta!: EntityTable<AporteMeta, 'id'>;
  fiis!: EntityTable<FII, 'id'>;
  dividendosFII!: EntityTable<DividendoFII, 'id'>;
  gastosFixos!: EntityTable<GastoFixo, 'id'>;
  gamificacao!: EntityTable<GamificacaoState, 'id'>;
  categorias!: EntityTable<Categoria, 'id'>;
  formasPagamento!: EntityTable<FormaPagamento, 'id'>;
  preferencias!: EntityTable<Preferencias, 'id'>;
  dividas!: EntityTable<Divida, 'id'>;
  pagamentosDivida!: EntityTable<PagamentoDivida, 'id'>;

  constructor() {
    super('FinanceiroApp');

    this.version(1).stores({
      lancamentos:    '++id, tipo, mes, ano, [mes+ano], categoria, formaPagamento, gastoFixo, parcelado, lancamentoPaiId',
      metas:          '++id, ativa',
      aportesMeta:    '++id, metaId',
      fiis:           '++id, ticker',
      dividendosFII:  '++id, fiiId, mes, ano',
      gastosFixos:    '++id, ativo',
      gamificacao:    '++id',
      categorias:     '++id, tipo, ativa, ordem',
      formasPagamento:'++id, tipo, ativa, ordem',
      preferencias:   '++id',
    });

    this.version(2).stores({
      lancamentos:    '++id, tipo, mes, ano, [mes+ano], data, categoria, formaPagamento, gastoFixo, parcelado, lancamentoPaiId',
      categorias:     '++id, nome, tipo, ativa, ordem',
      formasPagamento:'++id, nome, tipo, ativa, ordem',
    });

    this.version(3).stores({
      lancamentos:      '++id, tipo, mes, ano, [mes+ano], data, categoria, formaPagamento, gastoFixo, parcelado, lancamentoPaiId, dividaId, pagamentoDividaId',
      dividas:          '++id, status',
      pagamentosDivida: '++id, dividaId, origem',
    });

    this.version(4).stores({
      dividas: '++id, status, origemLancamentoGrupoId',
    });
  }
}

export const db = new FinanceiroDatabase();

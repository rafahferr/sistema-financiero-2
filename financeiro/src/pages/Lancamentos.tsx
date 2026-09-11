import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Check, Pencil, Trash2, Filter } from 'lucide-react';
import Header from '../components/Layout/Header';
import FormLancamento from '../components/Lancamento/FormLancamento';
import { Toast, useToast } from '../components/Toast';
import { useLancamentos } from '../hooks/useLancamentos';
import { removerPagamentoDivida, recalcularDivida } from '../hooks/useDividas';
import { db } from '../db/database';
import { formatarMoeda, formatarData, mesAtual, anoAtual } from '../utils/formatters';
import type { Lancamento } from '../types';

export default function Lancamentos() {
  const [mes, setMes] = useState(mesAtual());
  const [ano, setAno] = useState(anoAtual());
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | undefined>();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [filtroCat, setFiltroCat] = useState('');
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const { togglePago: togglePagoHook } = useLancamentos();

  const lancamentos = useLiveQuery(
    () => db.lancamentos
      .where('[mes+ano]').equals([mes, ano])
      .toArray()
      .then(arr => arr.sort((a, b) => b.data.localeCompare(a.data))),
    [mes, ano]
  ) ?? [];

  const categorias = useLiveQuery(() =>
    db.categorias.toArray().then(arr => arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
  ) ?? [];

  function navMes(dir: number) {
    const d = new Date(ano, mes - 1 + dir, 1);
    setMes(d.getMonth() + 1);
    setAno(d.getFullYear());
  }

  const filtrados = lancamentos.filter(l => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
    if (filtroCat && l.categoria !== filtroCat) return false;
    return true;
  });

  // Agrupar por semana
  const porSemana: Record<number, Lancamento[]> = {};
  filtrados.forEach(l => {
    const dia = parseInt(l.data.split('-')[2]);
    const sem = Math.ceil(dia / 7);
    if (!porSemana[sem]) porSemana[sem] = [];
    porSemana[sem].push(l);
  });
  // Dentro de cada semana, o que já foi pago afunda para o final da lista.
  Object.values(porSemana).forEach(itens => {
    itens.sort((a, b) => Number(a.pago) - Number(b.pago));
  });

  async function togglePago(id: number, pago: boolean) {
    await togglePagoHook(id, !pago);
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este lançamento?')) return;
    const lancamento = await db.lancamentos.get(id);
    if (lancamento?.lancamentoPaiId === undefined && lancamento?.parcelado) {
      if (confirm('Excluir também as demais parcelas?')) {
        await db.lancamentos.where('lancamentoPaiId').equals(id).delete();
      }
    }
    if (lancamento?.pagamentoDividaId) {
      await removerPagamentoDivida(lancamento.pagamentoDividaId, true);
    }
    await db.lancamentos.delete(id);
    if (lancamento?.origemDivida === 'atraso' && lancamento.dividaId) {
      await recalcularDivida(lancamento.dividaId);
    }
    mostrarToast('Lançamento excluído.');
  }

  function abrirEditar(l: Lancamento) {
    setEditando(l);
    setModalAberto(true);
  }

  const totalReceitas = filtrados.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const totalDespesas = filtrados.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
  const totalFaltaPagar = filtrados.filter(l => l.tipo === 'despesa' && !l.pago).reduce((s, l) => s + l.valor, 0);

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header
        titulo="Lançamentos"
        mes={mes}
        ano={ano}
        onMesAnterior={() => navMes(-1)}
        onMesSeguinte={() => navMes(1)}
      />

      <div className="p-6">
        {/* Resumo topo */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
            <span className="text-green-400 text-sm font-medium">Entradas: {formatarMoeda(totalReceitas)}</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <span className="text-red-400 text-sm font-medium">Saídas: {formatarMoeda(totalDespesas)}</span>
          </div>
          {totalFaltaPagar > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
              <span className="text-yellow-400 text-sm font-medium">Falta pagar: {formatarMoeda(totalFaltaPagar)}</span>
            </div>
          )}
          <div className="flex-1" />
          <button
            onClick={() => { setEditando(undefined); setModalAberto(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <Filter size={15} className="text-gray-400" />
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {(['todos','receita','despesa'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtroTipo === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'receita' ? '↑ Receitas' : '↓ Despesas'}
              </button>
            ))}
          </div>
          <select
            value={filtroCat}
            onChange={e => setFiltroCat(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.nome}>{c.emoji} {c.nome}</option>
            ))}
          </select>
        </div>

        {/* Lista por semana */}
        {Object.keys(porSemana).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400 text-lg font-medium">Nenhum lançamento encontrado</p>
            <button
              onClick={() => { setEditando(undefined); setModalAberto(true); }}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline"
            >
              Adicionar o primeiro lançamento
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(porSemana).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([sem, itens]) => (
              <div key={sem}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-xs font-medium">Semana {sem}</span>
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-500 text-xs">
                    {formatarMoeda(itens.filter(i => i.tipo === 'receita').reduce((s,l) => s+l.valor,0))} entrada |{' '}
                    {formatarMoeda(itens.filter(i => i.tipo === 'despesa').reduce((s,l) => s+l.valor,0))} saída
                  </span>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {itens.map((l, idx) => (
                    <div
                      key={l.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-all ${
                        idx < itens.length - 1 ? 'border-b border-gray-800/60' : ''
                      } ${l.pago ? 'opacity-50 hover:opacity-80' : ''} hover:bg-gray-800/40`}
                    >
                      {/* Pago toggle */}
                      <button
                        onClick={() => togglePago(l.id!, l.pago)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          l.pago
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {l.pago && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${l.pago ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {l.descricao}
                          </span>
                          {l.totalParcelas && l.parcelaAtual && (
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                              {l.parcelaAtual}/{l.totalParcelas}
                            </span>
                          )}
                          {l.gastoFixo && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Fixo</span>
                          )}
                          {l.dividaId && (
                            <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                              {l.origemDivida === 'atraso' ? 'Atrasada' : 'Dívida'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-gray-500 text-xs">{formatarData(l.data)}</span>
                          <span className="text-gray-600 text-xs">·</span>
                          <span className="text-gray-500 text-xs">{l.categoria}</span>
                          {l.formaPagamento && (
                            <>
                              <span className="text-gray-600 text-xs">·</span>
                              <span className="text-gray-500 text-xs">{l.formaPagamento}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Valor */}
                      <span className={`text-sm font-bold shrink-0 ${
                        l.tipo === 'receita' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {l.tipo === 'receita' ? '+' : '-'}{formatarMoeda(l.valor)}
                      </span>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => abrirEditar(l)} className="p-1.5 text-gray-500 hover:text-white rounded transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => excluir(l.id!)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <FormLancamento
          onClose={() => { setModalAberto(false); setEditando(undefined); }}
          onSucesso={() => {
            setModalAberto(false);
            setEditando(undefined);
            mostrarToast(editando ? 'Lançamento atualizado! ✨' : 'Lançamento adicionado! +10 XP ⚡');
          }}
          lancamentoEditar={editando}
        />
      )}

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

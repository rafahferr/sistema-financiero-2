import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, Pencil, HandCoins, Link2, Store } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useDividas } from '../hooks/useDividas';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { formatarMoeda, formatarData, dataHoje } from '../utils/formatters';
import { Toast, useToast } from '../components/Toast';
import type { Divida, PagamentoDivida } from '../types';

const STATUS_INFO: Record<Divida['status'], { label: string; cor: string; bg: string }> = {
  em_aberto: { label: 'Em aberto', cor: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  atrasada:  { label: 'Atrasada',  cor: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  quitada:   { label: 'Quitada',   cor: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
};

function CardDivida({ divida, pagamentos, onPagamento, onEditar, onExcluir, onExcluirPagamento }: {
  divida: Divida;
  pagamentos: PagamentoDivida[];
  onPagamento: (dividaId: number, valor: number, data: string, observacao: string) => void;
  onEditar: (d: Divida) => void;
  onExcluir: (id: number) => void;
  onExcluirPagamento: (id: number) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [valor, setValor] = useState('');
  const [data, setData] = useState(dataHoje());
  const [observacao, setObservacao] = useState('');

  const pct = divida.valorTotal > 0 ? Math.min(100, (divida.valorPago / divida.valorTotal) * 100) : 0;
  const restante = Math.max(0, divida.valorTotal - divida.valorPago);
  const pagoAMais = divida.valorPago > divida.valorTotal;
  const statusInfo = STATUS_INFO[divida.status];

  function handlePagamento(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0) return;
    onPagamento(divida.id!, v, data, observacao.trim());
    setValor(''); setData(dataHoje()); setObservacao(''); setPagando(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="h-2 bg-red-500" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{divida.descricao}</h3>
            {divida.credor && (
              <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                <Store size={11} /> {divida.credor}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEditar(divida)} className="text-gray-600 hover:text-white transition-colors" title="Editar dívida">
              <Pencil size={14} />
            </button>
            <button onClick={() => onExcluir(divida.id!)} className="text-gray-600 hover:text-red-400 transition-colors" title="Excluir dívida">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-3 ${statusInfo.bg} ${statusInfo.cor}`}>
          {statusInfo.label}
        </span>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">Pago</span>
            <span className="text-gray-300 font-medium">
              {formatarMoeda(divida.valorPago)} / {formatarMoeda(divida.valorTotal)}
            </span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${divida.status === 'quitada' ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{pct.toFixed(0)}%</span>
            <span className="text-gray-500">
              {pagoAMais ? `Pago a mais: ${formatarMoeda(divida.valorPago - divida.valorTotal)}` : `Restam ${formatarMoeda(restante)}`}
            </span>
          </div>
        </div>

        {divida.status === 'quitada' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-green-400 text-sm font-medium">✅ Dívida quitada!</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setPagando(v => !v)}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <HandCoins size={13} className="inline mr-1" />
            Adicionar Pagamento
          </button>
          <button
            onClick={() => setExpandido(v => !v)}
            className="px-2 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
          >
            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {pagando && (
          <form onSubmit={handlePagamento} className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" step="0.01" min="0"
                value={valor} onChange={e => setValor(e.target.value)}
                placeholder="Valor (R$)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500 placeholder:text-gray-600"
              />
              <input
                type="date"
                value={data} onChange={e => setData(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
            <input
              type="text"
              value={observacao} onChange={e => setObservacao(e.target.value)}
              placeholder="Observação (opcional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500 placeholder:text-gray-600"
            />
            <p className="text-gray-600 text-xs">Este pagamento cria automaticamente uma saída em Fluxos.</p>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg">Confirmar</button>
              <button type="button" onClick={() => setPagando(false)} className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-xs">Cancelar</button>
            </div>
          </form>
        )}

        {expandido && (
          <div className="mt-3 border-t border-gray-800 pt-3">
            <p className="text-gray-500 text-xs font-medium mb-2">Histórico de pagamentos</p>
            {pagamentos.length === 0
              ? <p className="text-gray-600 text-xs">Nenhum pagamento registrado.</p>
              : (
                <div className="space-y-1.5">
                  {pagamentos.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          p.origem === 'via_fluxo' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {p.origem === 'via_fluxo' ? <><Link2 size={9} /> Fluxos</> : 'Direto'}
                        </span>
                        <span className="text-gray-400 truncate">{formatarData(p.data)}{p.observacao ? ` · ${p.observacao}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-red-400 font-medium">{formatarMoeda(p.valor)}</span>
                        {p.origem === 'direto_no_modulo' && (
                          <button onClick={() => onExcluirPagamento(p.id!)} className="text-gray-600 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
}

function ModalDivida({ dividaEditar, onClose, onSalvar }: {
  dividaEditar?: Divida;
  onClose: () => void;
  onSalvar: (d: Omit<Divida, 'id' | 'valorPago' | 'status'>) => void;
}) {
  const { categoriasDespesa } = useConfiguracoes();
  const editando = !!dividaEditar;

  const [descricao, setDescricao] = useState(dividaEditar?.descricao ?? '');
  const [credor, setCredor] = useState(dividaEditar?.credor ?? '');
  const [valorTotal, setValorTotal] = useState(dividaEditar?.valorTotal?.toString() ?? '');
  const [dataContracao, setDataContracao] = useState(dividaEditar?.dataContracao ?? dataHoje());
  const [dataVencimento, setDataVencimento] = useState(dividaEditar?.dataVencimento ?? '');
  const [numeroParcelas, setNumeroParcelas] = useState(dividaEditar?.numeroParcelas?.toString() ?? '');
  const [valorParcela, setValorParcela] = useState(dividaEditar?.valorParcela?.toString() ?? '');
  const [categoria, setCategoria] = useState(dividaEditar?.categoria ?? '');
  const [observacoes, setObservacoes] = useState(dividaEditar?.observacoes ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !parseFloat(valorTotal)) return;
    onSalvar({
      descricao: descricao.trim(),
      credor: credor.trim() || undefined,
      valorTotal: parseFloat(valorTotal),
      dataContracao,
      dataVencimento: dataVencimento || undefined,
      numeroParcelas: numeroParcelas ? parseInt(numeroParcelas) : undefined,
      valorParcela: valorParcela ? parseFloat(valorParcela) : undefined,
      categoria: categoria || undefined,
      observacoes: observacoes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-semibold mb-4">{editando ? 'Editar Dívida' : 'Nova Dívida'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
            placeholder="Descrição (ex: Financiamento do carro)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-gray-600"
          />
          <input
            type="text" value={credor} onChange={e => setCredor(e.target.value)}
            placeholder="Credor (opcional, ex: Banco, Loja)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-gray-600"
          />
          <div>
            <label className="block text-gray-400 text-xs mb-1">Valor total</label>
            <input
              type="number" step="0.01" min="0" value={valorTotal} onChange={e => setValorTotal(e.target.value)}
              placeholder="0,00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-gray-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Data de contração</label>
              <input
                type="date" value={dataContracao} onChange={e => setDataContracao(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Vencimento (opcional)</label>
              <input
                type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Nº de parcelas (informativo)</label>
              <input
                type="number" min="0" value={numeroParcelas} onChange={e => setNumeroParcelas(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Valor da parcela</label>
              <input
                type="number" step="0.01" min="0" value={valorParcela} onChange={e => setValorParcela(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Categoria (opcional)</label>
            <select
              value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">Selecionar categoria...</option>
              {categoriasDespesa.map(c => (
                <option key={c.id} value={c.nome}>{c.emoji} {c.nome}</option>
              ))}
            </select>
          </div>
          <textarea
            value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-gray-600 resize-none"
          />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 text-sm py-2.5 rounded-xl">Cancelar</button>
            <button type="submit" className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-2.5 rounded-xl">
              {editando ? 'Salvar' : 'Criar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dividas() {
  const { dividas, adicionarDivida, editarDivida, excluirDivida, adicionarPagamento, removerPagamento, getPagamentosDaDivida } = useDividas();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Divida | undefined>();
  const [filtro, setFiltro] = useState<'todas' | 'em_aberto' | 'quitada'>('todas');
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();

  const dividasFiltradas = dividas
    .filter(d => filtro === 'todas' ? true : filtro === 'em_aberto' ? d.status !== 'quitada' : d.status === 'quitada')
    .sort((a, b) => (a.status === 'quitada' ? 1 : 0) - (b.status === 'quitada' ? 1 : 0));

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo="Dívidas" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {(['todas', 'em_aberto', 'quitada'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === f ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'todas' ? 'Todas' : f === 'em_aberto' ? 'Em aberto' : 'Quitadas'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditando(undefined); setModalAberto(true); }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Nova Dívida
          </button>
        </div>

        {dividasFiltradas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-gray-400 text-lg font-medium">Nenhuma dívida cadastrada</p>
            <button onClick={() => { setEditando(undefined); setModalAberto(true); }} className="mt-4 text-red-400 hover:text-red-300 text-sm underline">
              Cadastrar primeira dívida
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dividasFiltradas.map(divida => (
              <CardDivida
                key={divida.id}
                divida={divida}
                pagamentos={getPagamentosDaDivida(divida.id!)}
                onPagamento={async (dividaId, valor, data, observacao) => {
                  await adicionarPagamento(dividaId, valor, data, observacao || undefined);
                  mostrarToast('Pagamento registrado — saída lançada em Fluxos. 💸');
                }}
                onEditar={(d) => { setEditando(d); setModalAberto(true); }}
                onExcluir={async (id) => {
                  if (confirm('Excluir esta dívida? Isso também removerá os pagamentos e lançamentos espelho associados.')) {
                    await excluirDivida(id);
                    mostrarToast('Dívida excluída.');
                  }
                }}
                onExcluirPagamento={async (id) => {
                  if (confirm('Excluir este pagamento? O lançamento espelho em Fluxos também será removido.')) {
                    await removerPagamento(id);
                    mostrarToast('Pagamento removido.');
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalDivida
          dividaEditar={editando}
          onClose={() => { setModalAberto(false); setEditando(undefined); }}
          onSalvar={async (dados) => {
            if (editando?.id) {
              await editarDivida(editando.id, dados);
              mostrarToast('Dívida atualizada! ✏️');
            } else {
              await adicionarDivida(dados);
              mostrarToast('Dívida cadastrada! 💳');
            }
            setModalAberto(false);
            setEditando(undefined);
          }}
        />
      )}

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

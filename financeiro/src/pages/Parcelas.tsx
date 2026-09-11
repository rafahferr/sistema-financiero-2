import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, Check, AlertTriangle, X } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useParcelas, editarGrupoParcela, type GrupoParcela } from '../hooks/useParcelas';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { formatarMoeda, formatarData } from '../utils/formatters';
import { Toast, useToast } from '../components/Toast';

function CardParcela({ grupo, onEditar, onTogglePago }: {
  grupo: GrupoParcela;
  onEditar: (g: GrupoParcela) => void;
  onTogglePago: (id: number, pago: boolean) => void;
}) {
  const [expandido, setExpandido] = useState(false);

  const valorTotal = grupo.valorParcela * grupo.totalParcelas;
  const pagas = grupo.parcelas.filter(p => p.pago);
  const valorPago = pagas.reduce((s, p) => s + p.valor, 0);
  const pct = valorTotal > 0 ? Math.min(100, (valorPago / valorTotal) * 100) : 0;
  const concluida = pagas.length === grupo.totalParcelas;
  const faltamNoGrupo = grupo.totalParcelas - grupo.parcelas.length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className={`h-2 ${concluida ? 'bg-green-500' : 'bg-indigo-500'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate">{grupo.descricao}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{grupo.categoria} · {grupo.formaPagamento}</p>
          </div>
          <button onClick={() => onEditar(grupo)} className="text-gray-600 hover:text-white transition-colors shrink-0" title="Editar compra">
            <Pencil size={14} />
          </button>
        </div>

        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-3 ${
          concluida ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
        }`}>
          {pagas.length}/{grupo.totalParcelas} parcelas pagas
        </span>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">Pago</span>
            <span className="text-gray-300 font-medium">{formatarMoeda(valorPago)} / {formatarMoeda(valorTotal)}</span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${concluida ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{pct.toFixed(0)}%</span>
            <span className="text-gray-500">Restam {formatarMoeda(valorTotal - valorPago)}</span>
          </div>
        </div>

        {faltamNoGrupo > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-3">
            <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-400 text-xs">
              {faltamNoGrupo === 1 ? '1 parcela virou' : `${faltamNoGrupo} parcelas viraram`} dívida por falta de pagamento.{' '}
              <Link to="/dividas" className="underline">Ver Dívidas</Link>
            </p>
          </div>
        )}

        <button
          onClick={() => setExpandido(v => !v)}
          className="w-full flex items-center justify-center gap-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-medium rounded-lg transition-colors"
        >
          {expandido ? <>Ocultar parcelas <ChevronUp size={13} /></> : <>Ver parcelas <ChevronDown size={13} /></>}
        </button>

        {expandido && (
          <div className="mt-3 border-t border-gray-800 pt-3 space-y-1.5">
            {grupo.parcelas.map(p => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => onTogglePago(p.id!, p.pago)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    p.pago ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {p.pago && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>
                <span className="text-gray-400 w-10 shrink-0">{p.parcelaAtual}/{p.totalParcelas}</span>
                <span className="text-gray-500 flex-1">{formatarData(p.data)}</span>
                <span className={p.pago ? 'text-gray-500' : 'text-white font-medium'}>{formatarMoeda(p.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalEditarParcela({ grupo, onClose, onSalvar }: {
  grupo: GrupoParcela;
  onClose: () => void;
  onSalvar: (dados: Parameters<typeof editarGrupoParcela>[1]) => void;
}) {
  const { categoriasDespesa, categoriasReceita, formasPagamento } = useConfiguracoes();
  const categorias = grupo.tipo === 'receita' ? categoriasReceita : categoriasDespesa;

  const [descricao, setDescricao] = useState(grupo.descricao);
  const [categoria, setCategoria] = useState(grupo.categoria);
  const [formaPagamento, setFormaPagamento] = useState(grupo.formaPagamento);
  const [valorParcela, setValorParcela] = useState(grupo.valorParcela.toString());
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState(grupo.parcelas[0]?.data ?? '');
  const [totalParcelas, setTotalParcelas] = useState(grupo.totalParcelas.toString());

  const totalNum = parseInt(totalParcelas) || 0;
  const valorNum = parseFloat(valorParcela.replace(',', '.')) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valorNum || !dataPrimeiraParcela || totalNum < 1) return;

    if (totalNum < grupo.totalParcelas) {
      const removidas = grupo.parcelas.filter(p => (p.parcelaAtual ?? 1) > totalNum);
      const pagas = removidas.filter(p => p.pago).length;
      const aviso = pagas > 0
        ? `Reduzir para ${totalNum}x vai excluir ${removidas.length} parcela(s), sendo ${pagas} já marcada(s) como paga(s). Continuar?`
        : `Reduzir para ${totalNum}x vai excluir ${removidas.length} parcela(s) ainda não paga(s). Continuar?`;
      if (!confirm(aviso)) return;
    }

    onSalvar({
      descricao: descricao.trim(),
      categoria,
      formaPagamento,
      valorParcela: valorNum,
      dataPrimeiraParcela,
      totalParcelas: totalNum,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Editar Compra Parcelada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <p className="text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            Essas mudanças valem para as {grupo.parcelas.length} parcelas desta compra. A data é da 1ª parcela — as demais são recalculadas automaticamente, um mês depois da outra.
          </p>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Descrição</label>
            <input
              type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Data da 1ª parcela</label>
            <input
              type="date" value={dataPrimeiraParcela} onChange={e => setDataPrimeiraParcela(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Valor de cada parcela (R$)</label>
              <input
                type="number" step="0.01" min="0" value={valorParcela} onChange={e => setValorParcela(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Nº de parcelas</label>
              <input
                type="number" min="1" max="48" value={totalParcelas} onChange={e => setTotalParcelas(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {totalNum > 0 && valorNum > 0 && (
            <p className="text-indigo-400 text-xs font-medium -mt-1">
              {totalNum}x de {formatarMoeda(valorNum)} = {formatarMoeda(totalNum * valorNum)} total
              {totalNum > grupo.totalParcelas && ` · ${totalNum - grupo.totalParcelas} parcela(s) serão criadas`}
              {totalNum < grupo.totalParcelas && ` · ${grupo.totalParcelas - totalNum} parcela(s) serão excluídas`}
            </p>
          )}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Categoria</label>
            <select
              value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {categorias.map(c => (
                <option key={c.id} value={c.nome}>{c.emoji} {c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Forma de Pagamento</label>
            <select
              value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {formasPagamento.map(f => (
                <option key={f.id} value={f.nome}>{f.emoji} {f.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Parcelas() {
  const { grupos, togglePago } = useParcelas();
  const [filtro, setFiltro] = useState<'todas' | 'em_andamento' | 'concluidas'>('todas');
  const [editando, setEditando] = useState<GrupoParcela | undefined>();
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();

  const gruposFiltrados = grupos.filter(g => {
    const concluida = g.parcelas.filter(p => p.pago).length === g.totalParcelas;
    if (filtro === 'em_andamento') return !concluida;
    if (filtro === 'concluidas') return concluida;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo="Parcelas" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {(['todas', 'em_andamento', 'concluidas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'todas' ? 'Todas' : f === 'em_andamento' ? 'Em andamento' : 'Concluídas'}
              </button>
            ))}
          </div>
        </div>

        {gruposFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-400 text-lg font-medium">Nenhuma compra parcelada encontrada</p>
            <p className="text-gray-600 text-sm mt-1">Compras parceladas criadas em Lançamentos aparecem aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gruposFiltrados.map(grupo => (
              <CardParcela
                key={grupo.grupoId}
                grupo={grupo}
                onEditar={setEditando}
                onTogglePago={togglePago}
              />
            ))}
          </div>
        )}
      </div>

      {editando && (
        <ModalEditarParcela
          grupo={editando}
          onClose={() => setEditando(undefined)}
          onSalvar={async (dados) => {
            await editarGrupoParcela(editando.grupoId, dados);
            setEditando(undefined);
            mostrarToast('Compra parcelada atualizada! ✏️');
          }}
        />
      )}

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

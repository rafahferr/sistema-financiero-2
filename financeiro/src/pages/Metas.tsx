import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2, PiggyBank } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useMetas } from '../hooks/useMetas';
import { formatarMoeda, formatarData, dataHoje } from '../utils/formatters';
import { Toast, useToast } from '../components/Toast';
import type { Meta, AporteMeta } from '../types';

const EMOJIS = ['🎯','✈️','🏠','🚗','💻','📱','🎓','💍','🏖️','🏋️','🎸','📚'];
const CORES  = ['#6366f1','#22c55e','#f97316','#ec4899','#8b5cf6','#3b82f6','#f59e0b','#14b8a6'];

function CardMeta({ meta, aportes, onAporte, onArquivar }: {
  meta: Meta;
  aportes: AporteMeta[];
  onAporte: (metaId: number, valor: number, local: string, data: string) => void;
  onArquivar: (id: number) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [aportando, setAportando] = useState(false);
  const [valor, setValor] = useState('');
  const [local, setLocal] = useState('');
  const [data, setData] = useState(dataHoje());

  const pct = meta.valorTotal > 0 ? Math.min(100, (meta.valorGuardado / meta.valorTotal) * 100) : 0;
  const faltam = Math.max(0, meta.valorTotal - meta.valorGuardado);

  async function handleAporte(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(valor.replace(',', '.'));
    if (!v || v <= 0 || !local.trim()) return;
    await onAporte(meta.id!, v, local.trim(), data);
    setValor(''); setLocal(''); setData(dataHoje()); setAportando(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Cabeçalho colorido */}
      <div className="h-2" style={{ background: meta.cor ?? '#6366f1' }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.emoji ?? '🎯'}</span>
            <h3 className="text-white font-semibold">{meta.nome}</h3>
          </div>
          <button onClick={() => onArquivar(meta.id!)} className="text-gray-600 hover:text-red-400 transition-colors" title="Arquivar meta">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">Guardado</span>
            <span className="text-gray-300 font-medium">
              {formatarMoeda(meta.valorGuardado)} / {formatarMoeda(meta.valorTotal)}
            </span>
          </div>
          <div className="bg-gray-800 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, background: meta.cor ?? '#6366f1' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{pct.toFixed(0)}%</span>
            <span className="text-gray-500">Faltam {formatarMoeda(faltam)}</span>
          </div>
        </div>

        {pct >= 100 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-green-400 text-sm font-medium">🎉 Meta atingida!</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setAportando(v => !v)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <PiggyBank size={13} className="inline mr-1" />
            Registrar Aporte
          </button>
          <button
            onClick={() => setExpandido(v => !v)}
            className="px-2 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
          >
            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {aportando && (
          <form onSubmit={handleAporte} className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" step="0.01" min="0"
                value={valor} onChange={e => setValor(e.target.value)}
                placeholder="Valor (R$)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              />
              <input
                type="date"
                value={data} onChange={e => setData(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <input
              type="text"
              value={local} onChange={e => setLocal(e.target.value)}
              placeholder="Onde está guardado? (ex: Nubank, C6)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg">Confirmar</button>
              <button type="button" onClick={() => setAportando(false)} className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg text-xs">Cancelar</button>
            </div>
          </form>
        )}

        {expandido && (
          <div className="mt-3 border-t border-gray-800 pt-3">
            <p className="text-gray-500 text-xs font-medium mb-2">Histórico de aportes</p>
            {aportes.length === 0
              ? <p className="text-gray-600 text-xs">Nenhum aporte registrado.</p>
              : (
                <div className="space-y-1.5">
                  {aportes.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{formatarData(a.data)} · {a.local}</span>
                      <span className="text-green-400 font-medium">{formatarMoeda(a.valor)}</span>
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

function ModalNovaMeta({ onClose, onSalvar }: { onClose: () => void; onSalvar: (m: Omit<Meta, 'id'>) => void }) {
  const [nome, setNome] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [cor, setCor] = useState('#6366f1');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !parseFloat(valorTotal)) return;
    onSalvar({ nome: nome.trim(), valorTotal: parseFloat(valorTotal), valorGuardado: 0, emoji, cor, ativa: true });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Nova Meta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome da meta (ex: Viagem Chile)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
          />
          <input
            type="number" step="0.01" min="0" value={valorTotal} onChange={e => setValorTotal(e.target.value)}
            placeholder="Valor total (R$)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
          />
          <div>
            <p className="text-gray-400 text-xs mb-2">Emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`text-xl p-1.5 rounded-lg ${emoji === e ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                >{e}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-2">Cor</p>
            <div className="flex gap-2">
              {CORES.map(c => (
                <button key={c} type="button" onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${cor === c ? 'border-white scale-110' : 'border-transparent'} transition-transform`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 text-sm py-2.5 rounded-xl">Cancelar</button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2.5 rounded-xl">Criar Meta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Metas() {
  const { metas, adicionarMeta, arquivarMeta, adicionarAporte, getAportesDaMeta } = useMetas();
  const [modalNova, setModalNova] = useState(false);
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo="Metas Financeiras" />

      <div className="p-6">
        <div className="flex justify-end mb-5">
          <button
            onClick={() => setModalNova(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Nova Meta
          </button>
        </div>

        {metas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-400 text-lg font-medium">Nenhuma meta criada ainda</p>
            <button onClick={() => setModalNova(true)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline">
              Criar primeira meta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {metas.map(meta => (
              <CardMeta
                key={meta.id}
                meta={meta}
                aportes={getAportesDaMeta(meta.id!)}
                onAporte={async (metaId, valor, local, data) => {
                  await adicionarAporte({ metaId, valor, local, data });
                  mostrarToast('Aporte registrado! 💰');
                }}
                onArquivar={async (id) => {
                  if (confirm('Arquivar esta meta?')) {
                    await arquivarMeta(id);
                    mostrarToast('Meta arquivada.');
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {modalNova && (
        <ModalNovaMeta
          onClose={() => setModalNova(false)}
          onSalvar={async (dados) => {
            await adicionarMeta(dados);
            setModalNova(false);
            mostrarToast('Meta criada! 🎯');
          }}
        />
      )}

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

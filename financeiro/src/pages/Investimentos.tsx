import { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useFIIs } from '../hooks/useFIIs';
import { formatarMoeda, dataHoje, mesAtual, anoAtual } from '../utils/formatters';
import { Toast, useToast } from '../components/Toast';
import type { FII } from '../types';

function ModalFII({ fii, onClose, onSalvar }: {
  fii?: FII;
  onClose: () => void;
  onSalvar: (dados: Omit<FII, 'id'>) => void;
}) {
  const [ticker, setTicker] = useState(fii?.ticker ?? '');
  const [quantidade, setQuantidade] = useState(fii?.quantidade?.toString() ?? '');
  const [precoMedio, setPrecoMedio] = useState(fii?.precoMedio?.toString() ?? '');
  const [dataCompra, setDataCompra] = useState(fii?.dataCompra ?? dataHoje());
  const [corretora, setCorretora] = useState(fii?.corretora ?? '');
  const [setor, setSetor] = useState(fii?.setor ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim() || !quantidade || !precoMedio || !corretora.trim()) return;
    onSalvar({
      ticker: ticker.toUpperCase().trim(),
      quantidade: parseInt(quantidade),
      precoMedio: parseFloat(precoMedio),
      dataCompra,
      corretora: corretora.trim(),
      setor: setor.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-white font-semibold mb-4">{fii ? 'Editar FII' : 'Adicionar FII'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={ticker} onChange={e => setTicker(e.target.value)}
            placeholder="Ticker (ex: HGLG11)" style={{ textTransform: 'uppercase' }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)}
              placeholder="Quantidade"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600" />
            <input type="number" step="0.01" min="0" value={precoMedio} onChange={e => setPrecoMedio(e.target.value)}
              placeholder="Preço médio"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600" />
          </div>
          <input type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          <input type="text" value={corretora} onChange={e => setCorretora(e.target.value)}
            placeholder="Corretora (ex: Clear, XP)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600" />
          <input type="text" value={setor} onChange={e => setSetor(e.target.value)}
            placeholder="Setor (ex: Logística, Lajes Corporativas)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600" />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 text-sm py-2.5 rounded-xl">Cancelar</button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2.5 rounded-xl">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Investimentos() {
  const { fiis, totalInvestido, adicionarFII, editarFII, removerFII, adicionarDividendo, getDividendosPorMesAno } = useFIIs();
  const [modalFII, setModalFII] = useState(false);
  const [editandoFII, setEditandoFII] = useState<FII | undefined>();
  const [mes, setMes] = useState(mesAtual());
  const [ano, setAno] = useState(anoAtual());
  const [addingDivFiiId, setAddingDivFiiId] = useState<number | null>(null);
  const [divValor, setDivValor] = useState('');
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();

  const divDoMes = getDividendosPorMesAno(mes, ano);
  const totalDivMes = divDoMes.reduce((s, d) => s + d.valorTotal, 0);

  function navMes(dir: number) {
    const d = new Date(ano, mes - 1 + dir, 1);
    setMes(d.getMonth() + 1);
    setAno(d.getFullYear());
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo="Investimentos" mes={mes} ano={ano} onMesAnterior={() => navMes(-1)} onMesSeguinte={() => navMes(1)} />

      <div className="p-6 space-y-6">
        {/* Card total */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Investido em FIIs</p>
            <p className="text-purple-400 text-3xl font-bold">{formatarMoeda(totalInvestido)}</p>
          </div>
          <TrendingUp size={36} className="text-purple-400/40" />
        </div>

        {/* Carteira FII */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Carteira de FIIs</h3>
            <button
              onClick={() => { setEditandoFII(undefined); setModalFII(true); }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} /> Adicionar FII
            </button>
          </div>

          {fiis.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum FII cadastrado. Adicione o primeiro!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-gray-800">
                    <th className="text-left py-2 font-medium">Ticker</th>
                    <th className="text-right py-2 font-medium">Qtd</th>
                    <th className="text-right py-2 font-medium">Preço Médio</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-left py-2 font-medium pl-4">Setor</th>
                    <th className="text-left py-2 font-medium">Corretora</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {fiis.map(f => (
                    <tr key={f.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                      <td className="py-3 text-white font-bold">🏦 {f.ticker}</td>
                      <td className="py-3 text-right text-gray-300">{f.quantidade}</td>
                      <td className="py-3 text-right text-gray-300">{formatarMoeda(f.precoMedio)}</td>
                      <td className="py-3 text-right text-purple-400 font-medium">{formatarMoeda(f.quantidade * f.precoMedio)}</td>
                      <td className="py-3 text-gray-400 text-xs pl-4">{f.setor ?? '—'}</td>
                      <td className="py-3 text-gray-400 text-xs">{f.corretora}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditandoFII(f); setModalFII(true); }} className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"><Pencil size={13} /></button>
                          <button onClick={async () => { if (confirm(`Remover ${f.ticker}?`)) { await removerFII(f.id!); mostrarToast('FII removido.'); } }} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dividendos do mês */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Dividendos Recebidos</h3>
              <p className="text-green-400 text-sm font-medium mt-0.5">Total: {formatarMoeda(totalDivMes)}</p>
            </div>
          </div>

          {fiis.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Cadastre FIIs para registrar dividendos.</p>
          ) : (
            <div className="space-y-2">
              {fiis.map(f => {
                const div = divDoMes.find(d => d.fiiId === f.id);
                return (
                  <div key={f.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="text-white text-sm font-medium w-20">{f.ticker}</span>
                    {addingDivFiiId === f.id ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="number" step="0.01" min="0"
                          value={divValor} onChange={e => setDivValor(e.target.value)}
                          placeholder="Valor recebido"
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none"
                        />
                        <button onClick={async () => {
                          const v = parseFloat(divValor);
                          if (v > 0) {
                            await adicionarDividendo({ fiiId: f.id!, mes, ano, valorTotal: v });
                            setDivValor('');
                            setAddingDivFiiId(null);
                            mostrarToast('Dividendo registrado!');
                          }
                        }} className="bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded">OK</button>
                        <button onClick={() => setAddingDivFiiId(null)} className="text-gray-400 text-xs px-2">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 text-sm font-medium ${div ? 'text-green-400' : 'text-gray-600'}`}>
                          {div ? formatarMoeda(div.valorTotal) : '—'}
                        </span>
                        <button onClick={() => setAddingDivFiiId(f.id!)} className="text-xs text-indigo-400 hover:text-indigo-300">
                          {div ? 'Editar' : '+ Registrar'}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalFII && (
        <ModalFII
          fii={editandoFII}
          onClose={() => { setModalFII(false); setEditandoFII(undefined); }}
          onSalvar={async (dados) => {
            if (editandoFII?.id) {
              await editarFII(editandoFII.id, dados);
              mostrarToast('FII atualizado!');
            } else {
              await adicionarFII(dados);
              mostrarToast('FII adicionado! 🏦');
            }
            setModalFII(false);
            setEditandoFII(undefined);
          }}
        />
      )}

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

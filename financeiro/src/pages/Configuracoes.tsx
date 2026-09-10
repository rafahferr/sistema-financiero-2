import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';
import Header from '../components/Layout/Header';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useGastosFixos } from '../hooks/useGastosFixos';
import { db } from '../db/database';
import { Toast, useToast } from '../components/Toast';
import { formatarMoeda } from '../utils/formatters';
import type { Categoria, FormaPagamento, GastoFixo } from '../types';

type Aba = 'categorias' | 'pagamentos' | 'fixos' | 'preferencias' | 'backup';

/* ── Aba Categorias ─────────────────────────────────────────────── */
function AbaCategorias() {
  const { todasCategorias, adicionarCategoria, editarCategoria, removerCategoria } = useConfiguracoes();
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const [editId, setEditId] = useState<number | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [form, setForm] = useState<Partial<Categoria>>({ tipo: 'despesa', emoji: '📦', cor: '#94a3b8', ativa: true });

  function resetForm() { setForm({ tipo: 'despesa', emoji: '📦', cor: '#94a3b8', ativa: true }); }

  async function salvar() {
    if (!form.nome?.trim()) return;
    const maxOrdem = todasCategorias.reduce((m, c) => Math.max(m, c.ordem ?? 0), 0);
    await adicionarCategoria({ nome: form.nome.trim(), tipo: form.tipo ?? 'despesa', emoji: form.emoji ?? '📦', cor: form.cor ?? '#94a3b8', ativa: true, ordem: maxOrdem + 1 });
    resetForm(); setNovaAberta(false);
    mostrarToast('Categoria criada!');
  }

  async function salvarEdicao(id: number) {
    if (!form.nome?.trim()) return;
    await editarCategoria(id, form);
    setEditId(null);
    mostrarToast('Categoria atualizada!');
  }

  async function excluir(id: number) {
    try { await removerCategoria(id); mostrarToast('Categoria excluída.'); }
    catch (e: unknown) { mostrarToast(e instanceof Error ? e.message : 'Erro ao excluir.', 'erro'); }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setNovaAberta(true); }} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> Nova Categoria
        </button>
      </div>

      {novaAberta && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={form.emoji ?? ''} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Emoji" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none" />
            <input value={form.nome ?? ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className="col-span-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2 items-center">
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Categoria['tipo'] }))} className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
              <option value="ambos">Ambos</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs">Cor:</label>
              <input type="color" value={form.cor ?? '#94a3b8'} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={salvar} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg">Salvar</button>
            <button onClick={() => setNovaAberta(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {todasCategorias.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            {editId === cat.id ? (
              <div className="flex-1 flex gap-2 items-center">
                <input value={form.emoji ?? cat.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="w-12 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm text-center focus:outline-none" />
                <input value={form.nome ?? cat.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none" />
                <input type="color" value={form.cor ?? cat.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                <button onClick={() => salvarEdicao(cat.id!)} className="p-1.5 text-green-400 hover:text-green-300"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:text-white"><X size={14} /></button>
              </div>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.cor }} />
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-white text-sm flex-1">{cat.nome}</span>
                <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-700 rounded">{cat.tipo}</span>
                <button onClick={() => { setForm({ ...cat }); setEditId(cat.id!); }} className="p-1.5 text-gray-500 hover:text-white"><Pencil size={13} /></button>
                <button onClick={() => editarCategoria(cat.id!, { ativa: !cat.ativa })} className={`p-1.5 rounded text-xs ${cat.ativa ? 'text-green-400 hover:text-gray-400' : 'text-gray-600 hover:text-green-400'}`} title={cat.ativa ? 'Desativar' : 'Ativar'}>
                  {cat.ativa ? '✓' : '○'}
                </button>
                <button onClick={() => excluir(cat.id!)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

/* ── Aba Formas de Pagamento ─────────────────────────────────────── */
function AbaFormasPagamento() {
  const { todasFormasPagamento, adicionarFormaPagamento, editarFormaPagamento, removerFormaPagamento } = useConfiguracoes();
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const [novaAberta, setNovaAberta] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<FormaPagamento>>({ tipo: 'outro', emoji: '💳', ativa: true });

  async function salvar() {
    if (!form.nome?.trim()) return;
    const maxOrdem = todasFormasPagamento.reduce((m, f) => Math.max(m, f.ordem ?? 0), 0);
    await adicionarFormaPagamento({ nome: form.nome.trim(), tipo: form.tipo ?? 'outro', emoji: form.emoji ?? '💳', ativa: true, ordem: maxOrdem + 1 });
    setForm({ tipo: 'outro', emoji: '💳', ativa: true }); setNovaAberta(false);
    mostrarToast('Forma de pagamento criada!');
  }

  async function salvarEdicao(id: number) {
    await editarFormaPagamento(id, form);
    setEditId(null);
    mostrarToast('Atualizado!');
  }

  async function excluir(id: number) {
    try { await removerFormaPagamento(id); mostrarToast('Excluído.'); }
    catch (e: unknown) { mostrarToast(e instanceof Error ? e.message : 'Erro.', 'erro'); }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setNovaAberta(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> Nova Forma de Pagamento
        </button>
      </div>

      {novaAberta && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={form.emoji ?? ''} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Emoji" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none" />
            <input value={form.nome ?? ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className="col-span-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          </div>
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as FormaPagamento['tipo'] }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="vale">Vale</option>
            <option value="outro">Outro</option>
          </select>
          <div className="flex gap-2">
            <button onClick={salvar} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg">Salvar</button>
            <button onClick={() => setNovaAberta(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {todasFormasPagamento.map(fp => (
          <div key={fp.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
            {editId === fp.id ? (
              <div className="flex-1 flex gap-2 items-center">
                <input value={form.emoji ?? fp.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="w-12 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm text-center focus:outline-none" />
                <input value={form.nome ?? fp.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none" />
                <button onClick={() => salvarEdicao(fp.id!)} className="p-1.5 text-green-400"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400"><X size={14} /></button>
              </div>
            ) : (
              <>
                <span className="text-lg">{fp.emoji}</span>
                <span className="text-white text-sm flex-1">{fp.nome}</span>
                <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-700 rounded">{fp.tipo}</span>
                <button onClick={() => { setForm({ ...fp }); setEditId(fp.id!); }} className="p-1.5 text-gray-500 hover:text-white"><Pencil size={13} /></button>
                <button onClick={() => editarFormaPagamento(fp.id!, { ativa: !fp.ativa })} className={`p-1.5 rounded text-xs ${fp.ativa ? 'text-green-400' : 'text-gray-600'}`}>
                  {fp.ativa ? '✓' : '○'}
                </button>
                <button onClick={() => excluir(fp.id!)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

/* ── Aba Gastos Fixos ────────────────────────────────────────────── */
function AbaGastosFixos() {
  const { gastosFixos, adicionarGastoFixo, editarGastoFixo, removerGastoFixo } = useGastosFixos();
  const { categoriasDespesa, formasPagamento } = useConfiguracoes();
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const [novaAberta, setNovaAberta] = useState(false);
  const [form, setForm] = useState<Partial<GastoFixo>>({ ativo: true });

  async function salvar() {
    if (!form.descricao?.trim() || !form.categoria || !form.formaPagamento || !form.valor) return;
    await adicionarGastoFixo({ descricao: form.descricao.trim(), categoria: form.categoria, valor: form.valor, formaPagamento: form.formaPagamento, ativo: true });
    setForm({ ativo: true }); setNovaAberta(false);
    mostrarToast('Gasto fixo adicionado!');
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setNovaAberta(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> Novo Gasto Fixo
        </button>
      </div>

      {novaAberta && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <input value={form.descricao ?? ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.categoria ?? ''} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">Categoria</option>
              {categoriasDespesa.map(c => <option key={c.id} value={c.nome}>{c.emoji} {c.nome}</option>)}
            </select>
            <input type="number" step="0.01" min="0" value={form.valor ?? ''} onChange={e => setForm(f => ({ ...f, valor: parseFloat(e.target.value) }))} placeholder="Valor (R$)" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
          </div>
          <select value={form.formaPagamento ?? ''} onChange={e => setForm(f => ({ ...f, formaPagamento: e.target.value }))} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="">Forma de pagamento</option>
            {formasPagamento.map(fp => <option key={fp.id} value={fp.nome}>{fp.emoji} {fp.nome}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={salvar} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg">Salvar</button>
            <button onClick={() => setNovaAberta(false)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {gastosFixos.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Nenhum gasto fixo cadastrado.</p>
      ) : (
        <div className="space-y-1.5">
          {gastosFixos.map(g => (
            <div key={g.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <span className="text-white text-sm flex-1">{g.descricao}</span>
              <span className="text-gray-400 text-xs">{g.categoria}</span>
              <span className="text-indigo-400 text-sm font-medium">{formatarMoeda(g.valor)}</span>
              <button onClick={async () => { await editarGastoFixo(g.id!, { ativo: !g.ativo }); }} className={`p-1.5 text-xs ${g.ativo ? 'text-green-400' : 'text-gray-600'}`}>{g.ativo ? '✓' : '○'}</button>
              <button onClick={async () => { if (confirm('Remover?')) { await removerGastoFixo(g.id!); mostrarToast('Removido.'); } }} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

/* ── Aba Preferências ────────────────────────────────────────────── */
function AbaPreferencias() {
  const { preferencias, salvarPreferencias } = useConfiguracoes();
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const [form, setForm] = useState({ nomeUsuario: '', avatarEmoji: '', diaFechamentoFatura: 1, diaVencimentoFatura: 10, notificacaoGastosFixos: true });

  if (!preferencias) return <p className="text-gray-500 text-sm">Carregando...</p>;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    await salvarPreferencias({
      nomeUsuario: form.nomeUsuario || preferencias?.nomeUsuario,
      avatarEmoji: form.avatarEmoji || preferencias?.avatarEmoji,
      diaFechamentoFatura: form.diaFechamentoFatura,
      diaVencimentoFatura: form.diaVencimentoFatura,
      notificacaoGastosFixos: form.notificacaoGastosFixos,
    });
    mostrarToast('Preferências salvas!');
  }

  return (
    <form onSubmit={salvar} className="space-y-4 max-w-md">
      <div>
        <label className="block text-gray-400 text-xs mb-1">Seu nome</label>
        <input defaultValue={preferencias.nomeUsuario} onChange={e => setForm(f => ({ ...f, nomeUsuario: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="block text-gray-400 text-xs mb-1">Emoji de avatar</label>
        <input defaultValue={preferencias.avatarEmoji} onChange={e => setForm(f => ({ ...f, avatarEmoji: e.target.value }))}
          className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-2xl text-center focus:outline-none focus:border-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Dia fechamento fatura</label>
          <input type="number" min="1" max="28" defaultValue={preferencias.diaFechamentoFatura}
            onChange={e => setForm(f => ({ ...f, diaFechamentoFatura: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Dia vencimento fatura</label>
          <input type="number" min="1" max="28" defaultValue={preferencias.diaVencimentoFatura}
            onChange={e => setForm(f => ({ ...f, diaVencimentoFatura: parseInt(e.target.value) }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" defaultChecked={preferencias.notificacaoGastosFixos}
          onChange={e => setForm(f => ({ ...f, notificacaoGastosFixos: e.target.checked }))}
          className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500" />
        <span className="text-gray-300 text-sm">Mostrar alerta de gastos fixos no início do mês</span>
      </label>
      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
        Salvar Preferências
      </button>
      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </form>
  );
}

/* ── Aba Backup ──────────────────────────────────────────────────── */
function AbaBackup() {
  const { toastMsg, toastTipo, mostrarToast, fecharToast } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [inputConfirm, setInputConfirm] = useState('');

  async function exportarJSON() {
    const [lancamentos, metas, aportesMeta, fiis, dividendosFII, gastosFixos, categorias, formasPagamento, preferencias, gamificacao] = await Promise.all([
      db.lancamentos.toArray(), db.metas.toArray(), db.aportesMeta.toArray(),
      db.fiis.toArray(), db.dividendosFII.toArray(), db.gastosFixos.toArray(),
      db.categorias.toArray(), db.formasPagamento.toArray(), db.preferencias.toArray(), db.gamificacao.toArray(),
    ]);
    const data = { lancamentos, metas, aportesMeta, fiis, dividendosFII, gastosFixos, categorias, formasPagamento, preferencias, gamificacao };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    mostrarToast('Backup exportado!');
  }

  async function importarJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Isso irá substituir todos os dados atuais. Tem certeza?')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.transaction('rw', [db.lancamentos, db.metas, db.aportesMeta, db.fiis, db.dividendosFII, db.gastosFixos, db.categorias, db.formasPagamento, db.preferencias, db.gamificacao], async () => {
        await Promise.all([db.lancamentos.clear(), db.metas.clear(), db.aportesMeta.clear(), db.fiis.clear(), db.dividendosFII.clear(), db.gastosFixos.clear(), db.categorias.clear(), db.formasPagamento.clear(), db.preferencias.clear(), db.gamificacao.clear()]);
        if (data.lancamentos?.length) await db.lancamentos.bulkAdd(data.lancamentos);
        if (data.metas?.length) await db.metas.bulkAdd(data.metas);
        if (data.aportesMeta?.length) await db.aportesMeta.bulkAdd(data.aportesMeta);
        if (data.fiis?.length) await db.fiis.bulkAdd(data.fiis);
        if (data.dividendosFII?.length) await db.dividendosFII.bulkAdd(data.dividendosFII);
        if (data.gastosFixos?.length) await db.gastosFixos.bulkAdd(data.gastosFixos);
        if (data.categorias?.length) await db.categorias.bulkAdd(data.categorias);
        if (data.formasPagamento?.length) await db.formasPagamento.bulkAdd(data.formasPagamento);
        if (data.preferencias?.length) await db.preferencias.bulkAdd(data.preferencias);
        if (data.gamificacao?.length) await db.gamificacao.bulkAdd(data.gamificacao);
      });
      mostrarToast('Backup restaurado com sucesso!');
    } catch {
      mostrarToast('Erro ao importar backup. Verifique o arquivo.', 'erro');
    }
    e.target.value = '';
  }

  async function resetarTudo() {
    if (inputConfirm !== 'CONFIRMAR') return;
    await Promise.all([db.lancamentos.clear(), db.metas.clear(), db.aportesMeta.clear(), db.fiis.clear(), db.dividendosFII.clear(), db.gastosFixos.clear(), db.categorias.clear(), db.formasPagamento.clear(), db.preferencias.clear(), db.gamificacao.clear()]);
    setConfirmReset(false); setInputConfirm('');
    mostrarToast('Todos os dados foram apagados. Recarregue a página.');
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Exportar */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-3">
        <h4 className="text-white font-medium">Exportar Dados</h4>
        <button onClick={exportarJSON} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Download size={15} /> Exportar tudo (JSON)
        </button>
      </div>

      {/* Importar */}
      <div className="bg-gray-800 rounded-xl p-5 space-y-3">
        <h4 className="text-white font-medium">Importar Backup</h4>
        <label className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer w-fit">
          <Upload size={15} /> Importar arquivo JSON
          <input type="file" accept=".json" onChange={importarJSON} className="hidden" />
        </label>
      </div>

      {/* Resetar */}
      <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-5 space-y-3">
        <h4 className="text-red-400 font-medium flex items-center gap-2"><AlertTriangle size={15} /> Apagar Todos os Dados</h4>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="bg-red-700 hover:bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            Apagar todos os dados
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-300 text-xs">Digite <strong>CONFIRMAR</strong> para apagar:</p>
            <input value={inputConfirm} onChange={e => setInputConfirm(e.target.value)} placeholder="CONFIRMAR"
              className="w-full bg-gray-900 border border-red-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={resetarTudo} disabled={inputConfirm !== 'CONFIRMAR'} className="bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">Confirmar</button>
              <button onClick={() => { setConfirmReset(false); setInputConfirm(''); }} className="bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {toastMsg && <Toast mensagem={toastMsg} tipo={toastTipo} onClose={fecharToast} />}
    </div>
  );
}

/* ── Página Principal ────────────────────────────────────────────── */
export default function Configuracoes() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('categorias');

  const abas: { id: Aba; label: string }[] = [
    { id: 'categorias',   label: 'Categorias' },
    { id: 'pagamentos',   label: 'Formas de Pagamento' },
    { id: 'fixos',        label: 'Gastos Fixos' },
    { id: 'preferencias', label: 'Preferências' },
    { id: 'backup',       label: 'Backup' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo="Configurações" />
      <div className="p-6">
        {/* Abas */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 flex-wrap">
          {abas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                abaAtiva === aba.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {abaAtiva === 'categorias'   && <AbaCategorias />}
        {abaAtiva === 'pagamentos'   && <AbaFormasPagamento />}
        {abaAtiva === 'fixos'        && <AbaGastosFixos />}
        {abaAtiva === 'preferencias' && <AbaPreferencias />}
        {abaAtiva === 'backup'       && <AbaBackup />}
      </div>
    </div>
  );
}

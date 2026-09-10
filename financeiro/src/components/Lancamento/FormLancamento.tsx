import { useState } from 'react';
import { useLancamentos } from '../../hooks/useLancamentos';
import { useConfiguracoes } from '../../hooks/useConfiguracoes';
import { useDividas } from '../../hooks/useDividas';
import { dataHoje, formatarMoeda } from '../../utils/formatters';
import { X } from 'lucide-react';
import type { Lancamento } from '../../types';

interface Props {
  onClose: () => void;
  onSucesso: () => void;
  lancamentoEditar?: Lancamento;
}

export default function FormLancamento({ onClose, onSucesso, lancamentoEditar }: Props) {
  const { adicionarLancamento, editarLancamento } = useLancamentos();
  const { categoriasDespesa, categoriasReceita, formasPagamento } = useConfiguracoes();
  const { dividas } = useDividas();

  const editando = !!lancamentoEditar;
  const ehEspelhoDeDivida = lancamentoEditar?.origemDivida === 'direto_no_modulo';

  const [tipo, setTipo] = useState<'receita' | 'despesa'>(lancamentoEditar?.tipo ?? 'despesa');
  const [descricao, setDescricao] = useState(lancamentoEditar?.descricao ?? '');
  const [data, setData] = useState(lancamentoEditar?.data ?? dataHoje());
  const [categoria, setCategoria] = useState(lancamentoEditar?.categoria ?? '');
  const [formaPagamento, setFormaPagamento] = useState(lancamentoEditar?.formaPagamento ?? '');
  const [valor, setValor] = useState(lancamentoEditar?.valor?.toString() ?? '');
  const [parcelado, setParcelado] = useState(lancamentoEditar?.parcelado ?? false);
  const [numeroParcelas, setNumeroParcelas] = useState(lancamentoEditar?.numeroParcelas ?? 2);
  const [gastoFixo, setGastoFixo] = useState(lancamentoEditar?.gastoFixo ?? false);
  const [dividaId, setDividaId] = useState<string>(lancamentoEditar?.dividaId?.toString() ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const dividasEmAberto = dividas.filter(d => d.status !== 'quitada');
  // Vínculo com dívida só é definido na criação, para manter a lógica de sincronização simples.
  const mostrarVinculoDivida = tipo === 'despesa' && !parcelado && !editando;
  const dividaVinculada = editando && lancamentoEditar?.dividaId
    ? dividas.find(d => d.id === lancamentoEditar.dividaId)
    : undefined;

  const categorias = tipo === 'receita' ? categoriasReceita : categoriasDespesa;
  // Quando parcelado, o usuário digita o valor da parcela; o total é calculado
  const valorNum = parseFloat(valor.replace(',', '.')) || 0;
  const valorTotal = parcelado && numeroParcelas > 1 ? valorNum * numeroParcelas : valorNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) { setErro('Informe a descrição.'); return; }
    if (!categoria) { setErro('Selecione uma categoria.'); return; }
    if (!formaPagamento) { setErro('Selecione a forma de pagamento.'); return; }
    if (valorNum <= 0) { setErro('Informe um valor válido.'); return; }

    setSalvando(true);
    setErro('');

    try {
      const dataObj = new Date(data + 'T00:00:00');
      const dados: Omit<Lancamento, 'id'> = {
        tipo,
        descricao: descricao.trim(),
        data,
        categoria,
        valor: valorNum,
        formaPagamento,
        parcelado,
        numeroParcelas: parcelado ? numeroParcelas : undefined,
        gastoFixo,
        pago: false,
        mes: dataObj.getMonth() + 1,
        ano: dataObj.getFullYear(),
      };

      if (editando && lancamentoEditar?.id) {
        // Vínculo com dívida não é editável por aqui — evita sobrescrever com undefined.
        await editarLancamento(lancamentoEditar.id, dados);
      } else {
        await adicionarLancamento({
          ...dados,
          dividaId: mostrarVinculoDivida && dividaId ? parseInt(dividaId) : undefined,
        });
      }
      onSucesso();
    } catch {
      setErro('Erro ao salvar lançamento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">
            {editando ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Toggle tipo */}
          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            <button
              type="button"
              onClick={() => setTipo('receita')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tipo === 'receita'
                  ? 'bg-green-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              ↑ Receita
            </button>
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tipo === 'despesa'
                  ? 'bg-red-600 text-white'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              ↓ Despesa
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Aluguel, Supermercado..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
            />
          </div>

          {/* Data + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Data</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                {parcelado ? 'Valor da parcela (R$)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Categoria</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Selecionar categoria...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.nome}>{c.emoji} {c.nome}</option>
              ))}
            </select>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Forma de Pagamento</label>
            <select
              value={formaPagamento}
              onChange={e => setFormaPagamento(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Selecionar forma de pagamento...</option>
              {formasPagamento.map(f => (
                <option key={f.id} value={f.nome}>{f.emoji} {f.nome}</option>
              ))}
            </select>
          </div>

          {/* Vínculo com dívida */}
          {mostrarVinculoDivida && dividasEmAberto.length > 0 && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Vincular a uma dívida (opcional)</label>
              <select
                value={dividaId}
                onChange={e => setDividaId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Nenhuma</option>
                {dividasEmAberto.map(d => (
                  <option key={d.id} value={d.id}>{d.descricao}</option>
                ))}
              </select>
            </div>
          )}

          {dividaVinculada && (
            <p className="text-indigo-400 text-xs bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              🔗 {ehEspelhoDeDivida ? 'Gerado automaticamente pelo pagamento da dívida' : 'Vinculado ao pagamento da dívida'} "{dividaVinculada.descricao}"
            </p>
          )}

          {/* Checkboxes */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={parcelado}
                onChange={e => setParcelado(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-gray-300 text-sm">Parcelado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gastoFixo}
                onChange={e => setGastoFixo(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-gray-300 text-sm">Gasto Fixo</span>
            </label>
          </div>

          {/* Parcelas */}
          {parcelado && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Número de Parcelas</label>
              <input
                type="number"
                min="2"
                max="48"
                value={numeroParcelas}
                onChange={e => setNumeroParcelas(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              {valorNum > 0 && (
                <p className="text-indigo-400 text-xs mt-1 font-medium">
                  {numeroParcelas}x de {formatarMoeda(valorNum)} = {formatarMoeda(valorTotal)} total
                </p>
              )}
            </div>
          )}

          {erro && (
            <p className="text-red-400 text-sm">{erro}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              {salvando ? 'Salvando...' : editando ? 'Salvar' : '+ Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

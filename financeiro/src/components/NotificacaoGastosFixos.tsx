import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useGastosFixos } from '../hooks/useGastosFixos';
import { mesNome, formatarMoeda } from '../utils/formatters';
import { Bell } from 'lucide-react';

interface Props {
  mes: number;
  ano: number;
}

export function NotificacaoGastosFixos({ mes, ano }: Props) {
  const [visivel, setVisivel] = useState(false);
  const [modo, setModo] = useState<'prompt' | 'revisar'>('prompt');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const { gastosFixos, lancarGastosFixos } = useGastosFixos();

  const jaLancados = useLiveQuery(
    () => db.lancamentos.where('[mes+ano]').equals([mes, ano]).filter(l => l.gastoFixo).count(),
    [mes, ano]
  ) ?? 0;

  const preferencias = useLiveQuery(() => db.preferencias.toCollection().first());

  useEffect(() => {
    if (
      gastosFixos.length > 0 &&
      jaLancados === 0 &&
      preferencias?.notificacaoGastosFixos &&
      new Date().getDate() <= 5
    ) {
      setVisivel(true);
      setSelecionados(gastosFixos.map(g => g.id!).filter(Boolean));
    }
  }, [gastosFixos, jaLancados, preferencias]);

  if (!visivel || gastosFixos.length === 0) return null;

  async function lancarTodos() {
    await lancarGastosFixos(mes, ano);
    setVisivel(false);
  }

  async function lancarSelecionados() {
    await lancarGastosFixos(mes, ano, selecionados);
    setVisivel(false);
  }

  function toggleSelecionado(id: number) {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="mx-6 mt-4">
      <div className="bg-indigo-900/40 border border-indigo-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
            <Bell size={18} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              💡 Início de {mesNome(mes)}!
            </p>
            {modo === 'prompt' && (
              <>
                <p className="text-gray-300 text-sm mt-1">
                  Você tem {gastosFixos.length} gastos fixos cadastrados. Deseja lançá-los automaticamente?
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={lancarTodos} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Sim, lançar todos
                  </button>
                  <button onClick={() => setModo('revisar')} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Revisar antes
                  </button>
                  <button onClick={() => setVisivel(false)} className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Ignorar
                  </button>
                </div>
              </>
            )}

            {modo === 'revisar' && (
              <div className="mt-3 space-y-2">
                {gastosFixos.map(g => (
                  <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(g.id!)}
                      onChange={() => toggleSelecionado(g.id!)}
                      className="rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300 text-sm flex-1">{g.descricao}</span>
                    <span className="text-gray-400 text-xs">{formatarMoeda(g.valor)}</span>
                  </label>
                ))}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={lancarSelecionados}
                    disabled={selecionados.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Lançar {selecionados.length} selecionado(s)
                  </button>
                  <button onClick={() => setVisivel(false)} className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

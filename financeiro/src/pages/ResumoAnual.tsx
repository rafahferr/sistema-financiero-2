import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import Header from '../components/Layout/Header';
import { db } from '../db/database';
import { formatarMoeda, mesNomeCurto, anoAtual } from '../utils/formatters';

export default function ResumoAnual() {
  const [ano, setAno] = useState(anoAtual());

  const lancamentos = useLiveQuery(
    () => db.lancamentos.where('ano').equals(ano).toArray(),
    [ano]
  ) ?? [];

  const categorias = useLiveQuery(() => db.categorias.toArray()) ?? [];

  // Dados mensais
  const dadosMensais = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const doMes = lancamentos.filter(l => l.mes === m);
    const receitas  = doMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
    const despesas  = doMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
    return {
      mes: mesNomeCurto(m),
      Receitas: receitas,
      Despesas: despesas,
      Saldo: receitas - despesas,
    };
  });

  const totalReceitas = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const totalDespesas = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
  const saldoAnual   = totalReceitas - totalDespesas;

  // Top categorias do ano
  const topCats = categorias.map(cat => ({
    nome: `${cat.emoji} ${cat.nome}`,
    valor: lancamentos.filter(l => l.tipo === 'despesa' && l.categoria === cat.nome).reduce((s, l) => s + l.valor, 0),
  })).filter(c => c.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);

  // Mês que mais gastou
  const mesMaisGastou = dadosMensais.reduce((max, m) => m.Despesas > max.Despesas ? m : max, dadosMensais[0]);

  // Heatmap de intensidade mensal
  const maxDesp = Math.max(...dadosMensais.map(m => m.Despesas), 1);

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header titulo={`Resumo Anual — ${ano}`} />

      <div className="p-6 space-y-6">
        {/* Seletor de ano */}
        <div className="flex items-center gap-2">
          <button onClick={() => setAno(a => a - 1)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">← {ano - 1}</button>
          <span className="text-white font-bold text-lg px-2">{ano}</span>
          <button onClick={() => setAno(a => a + 1)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">{ano + 1} →</button>
        </div>

        {/* Cards anuais */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Entradas',  valor: totalReceitas, cor: 'text-green-400' },
            { label: 'Total Saídas',    valor: totalDespesas, cor: 'text-red-400' },
            { label: 'Saldo Anual',     valor: saldoAnual,    cor: saldoAnual >= 0 ? 'text-blue-400' : 'text-red-400' },
            { label: 'Mês Mais Gasto',  valor: mesMaisGastou.Despesas, cor: 'text-orange-400', label2: mesMaisGastou.mes },
          ].map((c, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-2">{c.label}</p>
              <p className={`text-xl font-bold ${c.cor}`}>{formatarMoeda(c.valor)}</p>
              {c.label2 && <p className="text-gray-500 text-xs mt-1">{c.label2}</p>}
            </div>
          ))}
        </div>

        {/* Gráfico de barras mensal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Entradas × Saídas Mês a Mês</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosMensais} barSize={14}>
              <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `R$${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => v != null ? formatarMoeda(Number(v)) : ''} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[3,3,0,0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Saldo mensal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `R$${(Number(v)/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => v != null ? formatarMoeda(Number(v)) : ''} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap + Top categorias */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Heatmap */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Intensidade de Gastos por Mês</h3>
            <div className="grid grid-cols-4 gap-2">
              {dadosMensais.map((m, i) => {
                const intensidade = m.Despesas / maxDesp;
                const r = Math.round(239 * intensidade);
                const g = Math.round(68 * intensidade);
                const b = Math.round(68 * intensidade);
                return (
                  <div
                    key={i}
                    className="rounded-lg p-3 text-center"
                    style={{ background: `rgba(${r},${g},${b},${0.15 + intensidade * 0.6})` }}
                    title={`${m.mes}: ${formatarMoeda(m.Despesas)}`}
                  >
                    <p className="text-white text-xs font-medium">{m.mes}</p>
                    <p className="text-gray-300 text-xs mt-0.5">{formatarMoeda(m.Despesas)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top categorias */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Top 5 Categorias do Ano</h3>
            {topCats.length === 0
              ? <p className="text-gray-500 text-sm">Sem dados de despesas.</p>
              : (
                <div className="space-y-3">
                  {topCats.map((c, i) => {
                    const pct = totalDespesas > 0 ? (c.valor / totalDespesas) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{c.nome}</span>
                          <span className="text-gray-400">{formatarMoeda(c.valor)}</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>

        {/* Tabela resumo mensal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Resumo por Mês</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-800">
                  <th className="text-left py-2 font-medium">Mês</th>
                  <th className="text-right py-2 font-medium">Entradas</th>
                  <th className="text-right py-2 font-medium">Saídas</th>
                  <th className="text-right py-2 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {dadosMensais.map((m, i) => (
                  <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                    <td className="py-2.5 text-gray-300 font-medium">{m.mes}</td>
                    <td className="py-2.5 text-right text-green-400">{formatarMoeda(m.Receitas)}</td>
                    <td className="py-2.5 text-right text-red-400">{formatarMoeda(m.Despesas)}</td>
                    <td className={`py-2.5 text-right font-semibold ${m.Saldo >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {formatarMoeda(m.Saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import Header from '../components/Layout/Header';
import { db } from '../db/database';
import { formatarMoeda, mesAtual, anoAtual } from '../utils/formatters';
import { NotificacaoGastosFixos } from '../components/NotificacaoGastosFixos';

const CORES_GRAFICOS = [
  '#6366f1','#f97316','#84cc16','#64748b','#0ea5e9',
  '#ec4899','#8b5cf6','#f59e0b','#14b8a6','#e879f9',
];

function SaudeFinanceira({ receitas, despesas }: { receitas: number; despesas: number }) {
  if (receitas === 0 && despesas === 0) return null;
  const margem = receitas > 0 ? ((receitas - despesas) / receitas) * 100 : -100;
  const { cor, icone, texto } =
    margem >= 20 ? { cor: 'text-green-400',  icone: '🟢', texto: 'Excelente — você gastou menos que ganhou!' }
    : margem >= 0 ? { cor: 'text-yellow-400', icone: '🟡', texto: 'Atenção — margem pequena.' }
    :               { cor: 'text-red-400',    icone: '🔴', texto: 'Alerta — você gastou mais que ganhou!' };
  return (
    <div className={`flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3 ${cor}`}>
      <span className="text-xl">{icone}</span>
      <span className="text-sm font-medium">{texto}</span>
    </div>
  );
}

export default function Home() {
  const [mes, setMes] = useState(mesAtual());
  const [ano, setAno] = useState(anoAtual());

  const lancamentos = useLiveQuery(
    () => db.lancamentos.where('[mes+ano]').equals([mes, ano]).toArray(),
    [mes, ano]
  ) ?? [];

  const formasPagamento = useLiveQuery(() =>
    db.formasPagamento.orderBy('ordem').toArray()
  ) ?? [];

  const categorias = useLiveQuery(() => db.categorias.toArray()) ?? [];

  function navMes(dir: number) {
    const d = new Date(ano, mes - 1 + dir, 1);
    setMes(d.getMonth() + 1);
    setAno(d.getFullYear());
  }

  const receitas   = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0);
  const despesas   = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0);
  const saldo      = receitas - despesas;
  const investido  = lancamentos
    .filter(l => l.categoria === 'Dividendos FII' || l.categoria === 'Investimentos')
    .reduce((s, l) => s + l.valor, 0);

  // Gastos por categoria (donut)
  const gastosCat = categorias.map(cat => ({
    name: `${cat.emoji} ${cat.nome}`,
    value: lancamentos
      .filter(l => l.tipo === 'despesa' && l.categoria === cat.nome)
      .reduce((s, l) => s + l.valor, 0),
    cor: cat.cor,
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  // Gastos semanais
  const semanas = [1, 2, 3, 4, 5].map(s => {
    const diaInicio = (s - 1) * 7 + 1;
    const diaFim = s * 7;
    const filtrado = lancamentos.filter(l => {
      const dia = parseInt(l.data.split('-')[2]);
      return dia >= diaInicio && dia <= diaFim;
    });
    return {
      name: `Sem ${s}`,
      Receitas: filtrado.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0),
      Despesas: filtrado.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0),
    };
  }).filter(s => s.Receitas > 0 || s.Despesas > 0);

  // Faturas por cartão
  const creditosFP = formasPagamento.filter(fp => fp.tipo === 'credito');
  const faturas = creditosFP.map(fp => {
    const total = lancamentos
      .filter(l => l.formaPagamento === fp.nome && l.tipo === 'despesa')
      .reduce((s, l) => s + l.valor, 0);
    const pago = lancamentos
      .filter(l => l.formaPagamento === fp.nome && l.tipo === 'despesa' && l.pago)
      .reduce((s, l) => s + l.valor, 0);
    return { nome: fp.nome, total, pago, aberto: total - pago };
  }).filter(f => f.total > 0);

  // Gastos por forma de pagamento
  const gastosFP = formasPagamento.map(fp => ({
    nome: fp.emoji + ' ' + fp.nome,
    valor: lancamentos
      .filter(l => l.formaPagamento === fp.nome && l.tipo === 'despesa')
      .reduce((s, l) => s + l.valor, 0),
  })).filter(f => f.valor > 0).sort((a, b) => b.valor - a.valor);

  const cards = [
    { label: 'Total de Entradas', valor: receitas,  cor: 'text-green-400',  bg: 'bg-green-400/10',  icon: TrendingUp },
    { label: 'Total de Saídas',   valor: despesas,  cor: 'text-red-400',    bg: 'bg-red-400/10',    icon: TrendingDown },
    { label: 'Saldo do Mês',      valor: saldo,     cor: saldo >= 0 ? 'text-blue-400' : 'text-red-400', bg: 'bg-blue-400/10', icon: Wallet },
    { label: 'Investido no Mês',  valor: investido, cor: 'text-purple-400', bg: 'bg-purple-400/10', icon: PiggyBank },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-950 overflow-y-auto">
      <Header
        titulo="Dashboard"
        mes={mes}
        ano={ano}
        onMesAnterior={() => navMes(-1)}
        onMesSeguinte={() => navMes(1)}
      />
      <NotificacaoGastosFixos mes={mes} ano={ano} />

      <div className="p-6 space-y-6">
        {/* Saúde financeira */}
        <SaudeFinanceira receitas={receitas} despesas={despesas} />

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map(({ label, valor, cor, bg, icon: Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs font-medium">{label}</span>
                <div className={`${bg} p-1.5 rounded-lg`}>
                  <Icon size={15} className={cor} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${cor}`}>{formatarMoeda(valor)}</p>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Donut — categorias */}
          {gastosCat.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Gastos por Categoria</h3>
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={gastosCat} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                      {gastosCat.map((entry, i) => (
                        <Cell key={i} fill={entry.cor ?? CORES_GRAFICOS[i % CORES_GRAFICOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v != null ? formatarMoeda(Number(v)) : ''} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {gastosCat.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.cor ?? CORES_GRAFICOS[i] }} />
                        <span className="text-gray-300 truncate max-w-28">{c.name}</span>
                      </div>
                      <span className="text-gray-400">{formatarMoeda(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Barras — entradas x saídas semanal */}
          {semanas.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Entradas × Saídas por Semana</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={semanas} barSize={18}>
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number | string) => `R$${(Number(v)/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => v != null ? formatarMoeda(Number(v)) : ''} contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Bar dataKey="Receitas" fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Faturas de cartão */}
        {faturas.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Faturas de Cartão</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-gray-800">
                    <th className="text-left py-2 font-medium">Cartão</th>
                    <th className="text-right py-2 font-medium">Fatura</th>
                    <th className="text-right py-2 font-medium">Pago</th>
                    <th className="text-right py-2 font-medium">Em Aberto</th>
                    <th className="text-right py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map(f => (
                    <tr key={f.nome} className="border-b border-gray-800/50">
                      <td className="py-3 text-white font-medium">💳 {f.nome}</td>
                      <td className="py-3 text-right text-white">{formatarMoeda(f.total)}</td>
                      <td className="py-3 text-right text-green-400">{formatarMoeda(f.pago)}</td>
                      <td className="py-3 text-right text-red-400">{formatarMoeda(f.aberto)}</td>
                      <td className="py-3 text-right">
                        {f.aberto <= 0
                          ? <span className="text-green-400 text-xs">✅ Pago</span>
                          : <span className="text-red-400 text-xs">❌ Em aberto</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gastos por forma de pagamento */}
        {gastosFP.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Gastos por Forma de Pagamento</h3>
            <div className="space-y-2">
              {gastosFP.map(fp => {
                const pct = despesas > 0 ? (fp.valor / despesas) * 100 : 0;
                return (
                  <div key={fp.nome} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm w-48 truncate">{fp.nome}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs w-24 text-right">{formatarMoeda(fp.valor)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lancamentos.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-lg font-medium text-gray-400">Nenhum lançamento neste mês</p>
            <p className="text-sm mt-1">Vá em Lançamentos para adicionar suas receitas e despesas.</p>
          </div>
        )}
      </div>
    </div>
  );
}

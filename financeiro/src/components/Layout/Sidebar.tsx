import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, BarChart2, Target,
  TrendingUp, Settings, Flame, CreditCard, Layers,
} from 'lucide-react';
import { useGamificacao } from '../../hooks/useGamificacao';
import { NIVEIS } from '../../types';

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lancamentos',   icon: List,            label: 'Lançamentos' },
  { to: '/resumo-anual',  icon: BarChart2,       label: 'Resumo Anual' },
  { to: '/metas',         icon: Target,          label: 'Metas' },
  { to: '/dividas',       icon: CreditCard,      label: 'Dívidas' },
  { to: '/parcelas',      icon: Layers,          label: 'Parcelas' },
  { to: '/investimentos', icon: TrendingUp,      label: 'Investimentos' },
  { to: '/configuracoes', icon: Settings,        label: 'Configurações' },
];

export default function Sidebar() {
  const { estado } = useGamificacao();
  const nivelInfo = NIVEIS.find(n => n.nivel === (estado?.nivel ?? 1)) ?? NIVEIS[0];
  const progressoPct = estado
    ? Math.min(100, ((estado.xp - nivelInfo.xpMin) / (nivelInfo.xpMax - nivelInfo.xpMin)) * 100)
    : 0;

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg leading-tight">
          💰 Financeiro
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">Controle Pessoal</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Widget de Gamificação */}
      {estado && (
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-yellow-400 text-xs font-bold">
                ⚡ Nível {estado.nivel} — {nivelInfo.nome}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1.5">
              <div
                className="bg-yellow-400 h-1.5 rounded-full transition-all"
                style={{ width: `${progressoPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{estado.xp} XP</span>
              <span>{nivelInfo.xpMax} XP</span>
            </div>
            {estado.streakDias > 0 && (
              <div className="flex items-center gap-1 mt-2 text-orange-400 text-xs font-medium">
                <Flame size={13} />
                <span>{estado.streakDias} dias seguidos!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mesNome } from '../../utils/formatters';
import { useConfiguracoes } from '../../hooks/useConfiguracoes';

interface HeaderProps {
  mes?: number;
  ano?: number;
  onMesAnterior?: () => void;
  onMesSeguinte?: () => void;
  titulo?: string;
}

export default function Header({ mes, ano, onMesAnterior, onMesSeguinte, titulo }: HeaderProps) {
  const { preferencias } = useConfiguracoes();
  const nome = preferencias?.nomeUsuario ?? 'Usuário';
  const avatar = preferencias?.avatarEmoji ?? '👤';

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {titulo && (
          <h2 className="text-white font-semibold text-base">{titulo}</h2>
        )}
        {mes !== undefined && ano !== undefined && (
          <div className="flex items-center gap-2">
            <button
              onClick={onMesAnterior}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-white font-semibold text-sm min-w-32 text-center capitalize">
              {mesNome(mes)} {ano}
            </span>
            <button
              onClick={onMesSeguinte}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Olá, {nome}</span>
        <span className="text-xl">{avatar}</span>
      </div>
    </header>
  );
}

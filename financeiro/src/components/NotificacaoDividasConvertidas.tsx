import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { formatarMoeda } from '../utils/formatters';

interface Props {
  convertidos: number;
  total: number;
  mesclados?: number;
}

export function NotificacaoDividasConvertidas({ convertidos, total, mesclados = 0 }: Props) {
  const [visivel, setVisivel] = useState(true);
  const navigate = useNavigate();

  if (!visivel) return null;

  return (
    <div className="mx-6 mt-4">
      <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-red-500/20 p-2 rounded-lg shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">⚠️ Pendências viraram dívida</p>
            {convertidos > 0 && (
              <p className="text-gray-300 text-sm mt-1">
                {convertidos === 1
                  ? '1 lançamento não pago de um mês anterior foi convertido automaticamente em dívida'
                  : `${convertidos} lançamentos não pagos de meses anteriores foram convertidos automaticamente em dívida`}
                {' '}({formatarMoeda(total)}). O registro original foi removido de Fluxos.
              </p>
            )}
            {mesclados > 0 && (
              <p className="text-gray-300 text-sm mt-1">
                {mesclados === 1
                  ? '1 dívida duplicada foi unificada com sua dívida de origem.'
                  : `${mesclados} dívidas duplicadas foram unificadas com suas dívidas de origem.`}
              </p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={() => { navigate('/dividas'); setVisivel(false); }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver Dívidas
              </button>
              <button
                onClick={() => setVisivel(false)}
                className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Ignorar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  mensagem: string;
  tipo?: 'sucesso' | 'erro';
  onClose: () => void;
}

export function Toast({ mensagem, tipo = 'sucesso', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast-enter fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-64">
      {tipo === 'sucesso'
        ? <CheckCircle size={18} className="text-green-400 shrink-0" />
        : <XCircle size={18} className="text-red-400 shrink-0" />
      }
      <p className="text-white text-sm flex-1">{mensagem}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X size={15} />
      </button>
    </div>
  );
}

interface UseToastReturn {
  toastMsg: string;
  toastTipo: 'sucesso' | 'erro';
  mostrarToast: (msg: string, tipo?: 'sucesso' | 'erro') => void;
  fecharToast: () => void;
}

export function useToast(): UseToastReturn {
  const [toastMsg, setToastMsg] = useState('');
  const [toastTipo, setToastTipo] = useState<'sucesso' | 'erro'>('sucesso');

  function mostrarToast(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    setToastMsg(msg);
    setToastTipo(tipo);
  }

  function fecharToast() {
    setToastMsg('');
  }

  return { toastMsg, toastTipo, mostrarToast, fecharToast };
}

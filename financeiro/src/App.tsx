import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home';
import Lancamentos from './pages/Lancamentos';
import ResumoAnual from './pages/ResumoAnual';
import Metas from './pages/Metas';
import Dividas from './pages/Dividas';
import Parcelas from './pages/Parcelas';
import Investimentos from './pages/Investimentos';
import Configuracoes from './pages/Configuracoes';
import { useSetupInicial } from './hooks/useSetupInicial';
import { useConversaoAutomaticaDividas } from './hooks/useDividas';
import { NotificacaoDividasConvertidas } from './components/NotificacaoDividasConvertidas';

function AppContent() {
  useSetupInicial();
  const conversaoDividas = useConversaoAutomaticaDividas();

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {conversaoDividas && (
          <NotificacaoDividasConvertidas
            convertidos={conversaoDividas.convertidos}
            total={conversaoDividas.total}
            mesclados={conversaoDividas.mesclados}
          />
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/resumo-anual" element={<ResumoAnual />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/dividas" element={<Dividas />} />
          <Route path="/parcelas" element={<Parcelas />} />
          <Route path="/investimentos" element={<Investimentos />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

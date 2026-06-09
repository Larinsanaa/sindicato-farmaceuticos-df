import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Avaliacao from './pages/Avaliacao/Avaliacao.jsx';
import NovaAvaliacao from './pages/NovaAvaliacao/NovaAvaliacao.jsx';
import HistoricoAvaliacoes from './pages/HistoricoAvaliacoes/HistoricoAvaliacoes.jsx';
import Perfil from './pages/Perfil/Perfil.jsx';
import RelatorioAvaliacao from './pages/RelatorioAvaliacao/RelatorioAvaliacao.jsx';
import RelatorioFinalAvaliacao from './pages/RelatorioFinalAvaliacao/RelatorioFinalAvaliacao.jsx';
import Configuracao from './pages/Configuracao/Configuracao.jsx';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/nova-avaliacao" element={<NovaAvaliacao />} />
                <Route path="/avaliacao" element={<Avaliacao />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/relatorio-final-avaliacao" element={<RelatorioFinalAvaliacao />} />
                <Route path="/historico-avaliacoes" element={<HistoricoAvaliacoes />} />
                <Route path="/relatorio-avaliacao/:id" element={<RelatorioAvaliacao />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                <Route path="/configuracao" element={<Configuracao />} />
            </Routes>
        </BrowserRouter>
    );
}

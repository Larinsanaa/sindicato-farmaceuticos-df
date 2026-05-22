import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Avaliacao from './pages/Avaliacao/Avaliacao.jsx';
import NovaAvaliacao from './pages/NovaAvaliacao/NovaAvaliacao.jsx';
import HistoricoAvaliacoes from './pages/HistoricoAvaliacoes/HistoricoAvaliacoes.jsx';
import RelatorioAvaliacao from './pages/RelatorioAvaliacao/RelatorioAvaliacao.jsx';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/nova-avaliacao" element={<NovaAvaliacao />} />
                <Route path="/avaliacao" element={<Avaliacao />} />
                <Route path="/historico-avaliacoes" element={<HistoricoAvaliacoes />} />
                <Route path="/relatorio-avaliacao/:id" element={<RelatorioAvaliacao />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

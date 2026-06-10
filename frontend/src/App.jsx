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
import NavegacaoMobile from './components/NavegacaoMobile.jsx';
import CadastroAvaliador from './pages/CadastroAvaliador/CadastroAvaliador.jsx';
import RedefinirSenha from './pages/RedefinirSenha/RedefinirSenha.jsx';

function ProtectedRoute({ children }) {
    const usuarioSalvo = localStorage.getItem('sindicato_usuario');

    if (!usuarioSalvo) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/nova-avaliacao" element={<ProtectedRoute><NovaAvaliacao /></ProtectedRoute>} />
                <Route path="/avaliacao" element={<ProtectedRoute><Avaliacao /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/relatorio-final-avaliacao" element={<ProtectedRoute><RelatorioFinalAvaliacao /></ProtectedRoute>} />
                <Route path="/historico-avaliacoes" element={<ProtectedRoute><HistoricoAvaliacoes /></ProtectedRoute>} />
                <Route path="/relatorio-avaliacao/:id" element={<ProtectedRoute><RelatorioAvaliacao /></ProtectedRoute>} />
                <Route path="/configuracao" element={<ProtectedRoute><Configuracao /></ProtectedRoute>} />
                <Route path="/cadastrar-avaliador" element={<ProtectedRoute><CadastroAvaliador /></ProtectedRoute>} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <NavegacaoMobile />
        </BrowserRouter>
    );
}

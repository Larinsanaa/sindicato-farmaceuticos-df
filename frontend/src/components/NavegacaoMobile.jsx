import { ClipboardCheck, Home, PlusCircle, Settings, UserPlus, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { obterUsuarioLogado } from '../lib/api.js';

export default function NavegacaoMobile() {
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = obterUsuarioLogado();

    if (!usuario || ['/login', '/redefinir-senha'].includes(location.pathname)) {
        return null;
    }

    const administrador = usuario.tipo === 'presidente';
    const itens = [
        { texto: 'Início', icone: <Home />, rota: '/dashboard', ativo: location.pathname === '/dashboard' },
        { texto: 'Avaliações', icone: <ClipboardCheck />, rota: '/historico-avaliacoes', ativo: location.pathname === '/historico-avaliacoes' || location.pathname.startsWith('/relatorio-avaliacao/') },
        ...(administrador ? [{ texto: 'Cadastrar avaliador', icone: <UserPlus />, rota: '/cadastrar-avaliador', ativo: location.pathname === '/cadastrar-avaliador' }] : []),
        ...(!administrador ? [{ texto: 'Nova avaliação', icone: <PlusCircle />, rota: '/nova-avaliacao', ativo: ['/nova-avaliacao', '/avaliacao', '/relatorio-final-avaliacao'].includes(location.pathname) }] : []),
        { texto: 'Perfil', icone: <UserRound />, rota: '/perfil', ativo: location.pathname === '/perfil' },
        ...(administrador ? [{ texto: 'Configuração', icone: <Settings />, rota: '/configuracao', ativo: location.pathname === '/configuracao' }] : [])
    ];

    return (
        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(15,23,42,0.10)] lg:hidden" aria-label="Navegação principal">
            <div className="mx-auto grid max-w-md gap-2" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
                {itens.map((item) => (
                    <button
                        className={`flex h-12 items-center justify-center rounded-md transition-colors ${item.ativo ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        type="button"
                        key={item.rota}
                        onClick={() => navigate(item.rota)}
                        title={item.texto}
                        aria-label={item.texto}
                        aria-current={item.ativo ? 'page' : undefined}
                    >
                        <span className="[&_svg]:h-5 [&_svg]:w-5">{item.icone}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

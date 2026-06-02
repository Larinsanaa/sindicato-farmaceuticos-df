import { useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { obterUsuarioLogado } from '../lib/api.js';

export default function Cabecalho({ textoBotao, onClick }) {
    const navigate = useNavigate();
    const usuario = obterUsuarioLogado();
    const fotoPerfil = usuario?.foto_perfil || usuario?.fotoPerfil || '';
    const nomeUsuario = usuario?.nome || 'Usuário';
    const subtitulo = usuario ? 'Perfil do usuário' : 'Usuário';
    const iniciais = gerarIniciais(nomeUsuario);

    function abrirPerfil() {
        navigate('/perfil');
    }

    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <Logo />

                {usuario || !textoBotao ? (
                    <button
                        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                        type="button"
                        onClick={abrirPerfil}
                        aria-label="Abrir perfil do usuário"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-extrabold text-slate-700 ring-2 ring-white">
                            {fotoPerfil ? (
                                <img alt={`Foto de ${nomeUsuario}`} className="h-full w-full object-cover" src={fotoPerfil} />
                            ) : (
                                iniciais
                            )}
                        </span>
                        <span className="min-w-0 pr-2 text-left">
                            <span className="block truncate text-sm font-bold text-slate-900">{nomeUsuario}</span>
                            <span className="block truncate text-xs text-slate-500">{subtitulo}</span>
                        </span>
                    </button>
                ) : (
                    <button
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        type="button"
                        onClick={onClick || (() => navigate('/login'))}
                    >
                        {textoBotao}
                    </button>
                )}
            </div>
        </header>
    );
}

function gerarIniciais(nome) {
    return String(nome)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join('') || 'U';
}

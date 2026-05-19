import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Home, LogOut, Settings, Store, UserRound } from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import TopoOndas from '../components/TopoOndas.jsx';

const farmacias = [
    { nome: 'Farmacia Central', cidade: 'Brasilia', status: 'Pendente' },
    { nome: 'Drogaria Norte', cidade: 'Taguatinga', status: 'Em analise' },
    { nome: 'Farmacia Popular', cidade: 'Ceilandia', status: 'Concluida' }
];

export default function Dashboard() {
    const navigate = useNavigate();

    const usuario = useMemo(() => {
        const usuarioSalvo = localStorage.getItem('sindicato_usuario');
        return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    }, []);

    function sair() {
        localStorage.removeItem('sindicato_token');
        localStorage.removeItem('sindicato_usuario');
        navigate('/');
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Sair" onClick={sair} />

            <section className="relative bg-slate-50">
                <TopoOndas />

                <div className="relative mx-auto grid min-h-[calc(100dvh-73px)] max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:py-12">
                    <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60">
                        <div className="mb-5 rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">Usuario</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{usuario?.nome || 'Usuario'}</p>
                            <p className="text-xs text-slate-500">{usuario?.email || 'email@email.com'}</p>
                        </div>

                        <nav className="space-y-1">
                            <MenuItem ativo icone={<Home />} texto="Inicio" />
                            <MenuItem icone={<Store />} texto="Farmacias" />
                            <MenuItem icone={<ClipboardCheck />} texto="Avaliacoes" />
                            <MenuItem icone={<UserRound />} texto="Perfil" />
                            <MenuItem icone={<Settings />} texto="Configurar" />
                        </nav>

                        <button className="mt-5 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" type="button" onClick={sair}>
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </aside>

                    <div className="space-y-6">
                        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
                            <p className="text-sm font-bold uppercase text-blue-950/70">Dashboard</p>
                            <h1 className="mt-2 text-3xl font-extrabold text-blue-950">Bem-vindo(a)</h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Acompanhe as farmacias e avaliacoes cadastradas no sistema.
                            </p>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-3">
                            <Card titulo="Farmacias" valor="12" />
                            <Card titulo="Avaliacoes" valor="28" />
                            <Card titulo="Pendentes" valor="5" />
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Ultimas farmacias</h2>
                                    <p className="text-sm text-slate-500">Dados temporarios para montar a tela.</p>
                                </div>
                                <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800" type="button">
                                    Nova avaliacao
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[520px] text-left text-sm">
                                    <thead className="border-b border-slate-200 text-slate-500">
                                        <tr>
                                            <th className="py-3 font-semibold">Farmacia</th>
                                            <th className="py-3 font-semibold">Cidade</th>
                                            <th className="py-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {farmacias.map((farmacia) => (
                                            <tr className="border-b border-slate-100" key={farmacia.nome}>
                                                <td className="py-3 font-semibold text-slate-800">{farmacia.nome}</td>
                                                <td className="py-3 text-slate-600">{farmacia.cidade}</td>
                                                <td className="py-3 text-slate-600">{farmacia.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    );
}

function MenuItem({ icone, texto, ativo = false }) {
    return (
        <button className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${ativo ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} type="button">
            <span className="h-4 w-4">{icone}</span>
            {texto}
        </button>
    );
}

function Card({ titulo, valor }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
            <p className="text-sm font-semibold text-slate-500">{titulo}</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-950">{valor}</p>
        </div>
    );
}

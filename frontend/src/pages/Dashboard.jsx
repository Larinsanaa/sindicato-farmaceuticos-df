import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Home, LogOut, PlusCircle, Settings, SlidersHorizontal, Star, Store, UserRound, X } from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import { avaliacoes } from '../data/avaliacoes.js';

export default function Dashboard() {
    const navigate = useNavigate();
    const [buscaFarmacia, setBuscaFarmacia] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(true);
    const [filtros, setFiltros] = useState({
        cidade: '',
        avaliador: '',
        dataInicio: '',
        dataFim: '',
        notaMinima: ''
    });

    const usuario = useMemo(() => {
        const usuarioSalvo = localStorage.getItem('sindicato_usuario');
        return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    }, []);

    const farmaciasFiltradas = useMemo(() => {
        const termo = buscaFarmacia.trim().toLowerCase();

        return avaliacoes.filter((avaliacao) => {
            const texto = `${avaliacao.farmacia} ${avaliacao.cnpj} ${avaliacao.cidade} ${avaliacao.avaliador} ${avaliacao.dataTexto} ${avaliacao.hora}`.toLowerCase();
            const nota = Number(avaliacao.notaGeral.replace(',', '.'));
            const combinaBusca = termo ? texto.includes(termo) : true;
            const combinaCidade = filtros.cidade ? avaliacao.cidade === filtros.cidade : true;
            const combinaAvaliador = filtros.avaliador ? avaliacao.avaliador === filtros.avaliador : true;
            const combinaDataInicio = filtros.dataInicio ? avaliacao.data >= filtros.dataInicio : true;
            const combinaDataFim = filtros.dataFim ? avaliacao.data <= filtros.dataFim : true;
            const combinaNota = filtros.notaMinima ? nota >= Number(filtros.notaMinima) : true;

            return combinaBusca && combinaCidade && combinaAvaliador && combinaDataInicio && combinaDataFim && combinaNota;
        });
    }, [buscaFarmacia, filtros]);

    const cidades = useMemo(() => [...new Set(avaliacoes.map((avaliacao) => avaliacao.cidade))], []);
    const avaliadores = useMemo(() => [...new Set(avaliacoes.map((avaliacao) => avaliacao.avaliador))], []);

    function alterarFiltro(campo, valor) {
        setFiltros((filtrosAtuais) => ({ ...filtrosAtuais, [campo]: valor }));
    }

    function limparFiltros() {
        setBuscaFarmacia('');
        setFiltros({
            cidade: '',
            avaliador: '',
            dataInicio: '',
            dataFim: '',
            notaMinima: ''
        });
    }

    function abrirRelatorio(id) {
        navigate(`/relatorio-avaliacao/${id}`);
    }

    function abrirRelatorioComTeclado(evento, id) {
        if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault();
            abrirRelatorio(id);
        }
    }

    function sair() {
        localStorage.removeItem('sindicato_token');
        localStorage.removeItem('sindicato_usuario');
        navigate('/');
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Sair" onClick={sair} />

            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 pb-24 sm:px-6 lg:grid lg:grid-cols-[230px_1fr] lg:gap-6 lg:px-8 lg:py-8 lg:pb-8">
                <div className="space-y-4 lg:space-y-6">
                    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:h-fit lg:p-4">
                        <div className="mb-3 rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">Usuario</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{usuario?.nome || 'Usuario'}</p>
                            <p className="break-all text-xs text-slate-500">{usuario?.email || 'email@email.com'}</p>
                        </div>

                        <nav className="grid grid-cols-5 gap-2 lg:block lg:space-y-1" aria-label="Menu principal">
                            <MenuItem ativo icone={<Home />} texto="Inicio" />
                            <MenuItem icone={<Store />} texto="Farmacias" textoMobile="Farm." />
                            <MenuItem icone={<ClipboardCheck />} texto="Avaliacoes" textoMobile="Aval." onClick={() => navigate('/historico-avaliacoes')} />
                            <MenuItem icone={<UserRound />} texto="Perfil" />
                            <MenuItem icone={<Settings />} texto="Config" />
                        </nav>

                        <button className="mt-3 hidden w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 lg:flex" type="button" onClick={sair}>
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </aside>

                    {mostrarFiltros && (
                        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:p-4" id="filtros-dashboard">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-extrabold text-slate-900">Filtros</h3>
                                <button className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900" type="button" onClick={limparFiltros} aria-label="Limpar todos os filtros">
                                    <X className="h-3.5 w-3.5" />
                                    Limpar
                                </button>
                            </div>

                            <div className="space-y-3">
                                <FiltroSelect label="Cidade" value={filtros.cidade} onChange={(valor) => alterarFiltro('cidade', valor)} options={cidades} />
                                <FiltroSelect label="Avaliador" value={filtros.avaliador} onChange={(valor) => alterarFiltro('avaliador', valor)} options={avaliadores} />
                                <FiltroData label="Data inicial" value={filtros.dataInicio} onChange={(valor) => alterarFiltro('dataInicio', valor)} />
                                <FiltroData label="Data final" value={filtros.dataFim} onChange={(valor) => alterarFiltro('dataFim', valor)} />

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nota minima</span>
                                    <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" value={filtros.notaMinima} onChange={(evento) => alterarFiltro('notaMinima', evento.target.value)}>
                                        <option value="">Todas</option>
                                        <option value="3">3,0+</option>
                                        <option value="4">4,0+</option>
                                        <option value="4.5">4,5+</option>
                                    </select>
                                </label>
                            </div>
                        </aside>
                    )}
                </div>

                <div className="space-y-4 lg:space-y-6">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <p className="text-xs font-bold uppercase text-blue-900/70 sm:text-sm">Dashboard</p>
                        <div className="mt-2 grid gap-3 sm:flex sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-extrabold leading-tight text-blue-950 sm:text-3xl">Bem-vindo(a)</h1>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Acompanhe as farmacias e avaliacoes cadastradas no sistema.
                                </p>
                            </div>
                            <button className="hidden rounded-md bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 sm:inline-flex" type="button" onClick={() => navigate('/nova-avaliacao')}>
                                Nova avaliacao
                            </button>
                        </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Card titulo="Avaliacoes" valor="200" />
                        <Card titulo="Farmacias" valor="12" />
                        <Card titulo="Media geral" valor="3,7" estrela destaque />
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Ultimas farmacias</h2>
                                <p className="text-sm text-slate-500">Dados temporarios para montar a tela.</p>
                            </div>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600" aria-live="polite">
                                {farmaciasFiltradas.length} de {avaliacoes.length}
                            </span>
                        </div>

                        <div className="mb-4 flex items-center gap-2 border-y border-slate-200 py-3">
                            <button className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border text-slate-600 hover:border-sky-300 hover:text-blue-700 ${mostrarFiltros ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200'}`} type="button" aria-label="Mostrar ou ocultar filtros" aria-controls="filtros-dashboard" aria-expanded={mostrarFiltros} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                                <SlidersHorizontal className="h-4 w-4" />
                            </button>
                            <div className="h-8 w-px bg-slate-200" />
                            <label className="relative block min-w-0 flex-1">
                                <span className="sr-only">Buscar farmacia, cidade ou data</span>
                                <input
                                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                    placeholder="Buscar farmacia, cidade ou data"
                                    value={buscaFarmacia}
                                    onChange={(evento) => setBuscaFarmacia(evento.target.value)}
                                />
                            </label>
                        </div>

                        <div className="space-y-3 sm:hidden">
                            {farmaciasFiltradas.map((farmacia) => (
                                <FarmaciaCard farmacia={farmacia} key={farmacia.id} onClick={() => abrirRelatorio(farmacia.id)} />
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto sm:block">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <caption className="sr-only">Ultimas farmacias avaliadas. Clique em uma linha para abrir o relatorio da avaliacao.</caption>
                                <thead className="border-b border-slate-200 text-slate-500">
                                    <tr>
                                        <th className="w-[30%] px-3 py-3 font-bold" scope="col">Farmacia</th>
                                        <th className="w-[15%] px-3 py-3 font-bold" scope="col">Cidade</th>
                                        <th className="w-[20%] px-3 py-3 font-bold" scope="col">Avaliador</th>
                                        <th className="w-[12%] px-3 py-3 text-center font-bold" scope="col">Media</th>
                                        <th className="w-[23%] px-3 py-3 font-bold" scope="col">Avaliado em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {farmaciasFiltradas.map((farmacia) => (
                                        <tr
                                            className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                                            key={farmacia.id}
                                            onClick={() => abrirRelatorio(farmacia.id)}
                                            onKeyDown={(evento) => abrirRelatorioComTeclado(evento, farmacia.id)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Abrir relatorio de ${farmacia.farmacia}, avaliada por ${farmacia.avaliador} em ${farmacia.dataTexto}`}
                                        >
                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-slate-800">{farmacia.farmacia}</p>
                                                <p className="text-xs text-slate-500">CNPJ {farmacia.cnpj}</p>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{farmacia.cidade}</td>
                                            <td className="px-3 py-3 text-slate-600">{farmacia.avaliador}</td>
                                            <td className="px-3 py-3 text-center font-bold text-blue-950">{farmacia.notaGeral}</td>
                                            <td className="px-3 py-3 text-slate-600">{farmacia.dataTexto}, {farmacia.hora}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {farmaciasFiltradas.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                                Nenhuma farmacia encontrada.
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <button
                className="fixed bottom-4 left-4 right-4 z-10 flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 sm:hidden"
                type="button"
                onClick={() => navigate('/nova-avaliacao')}
            >
                <PlusCircle className="h-5 w-5" />
                Nova avaliacao
            </button>
        </main>
    );
}

function MenuItem({ icone, texto, textoMobile, ativo = false, onClick }) {
    return (
        <button className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-[10px] font-semibold leading-tight lg:min-h-10 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:text-left lg:text-sm ${ativo ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`} type="button" onClick={onClick} aria-current={ativo ? 'page' : undefined}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                {icone}
            </span>
            <span className="lg:hidden">{textoMobile || texto}</span>
            <span className="hidden lg:inline">{texto}</span>
        </button>
    );
}

function Card({ titulo, valor, estrela = false, destaque = false }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm ${destaque ? 'col-span-2 sm:col-span-1' : ''}`}>
            <p className="text-xs font-semibold uppercase text-slate-500 sm:text-sm sm:normal-case">{titulo}</p>
            <p className="mt-2 flex items-center justify-center gap-2 text-2xl font-extrabold text-blue-950 sm:text-3xl">
                {estrela && <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 sm:h-7 sm:w-7" />}
                {valor}
            </p>
        </div>
    );
}

function FarmaciaCard({ farmacia, onClick }) {
    return (
        <button className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-sky-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" type="button" onClick={onClick} aria-label={`Abrir relatorio de ${farmacia.farmacia}, avaliada por ${farmacia.avaliador} em ${farmacia.dataTexto}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{farmacia.farmacia}</h3>
                    <p className="mt-1 text-xs text-slate-500">{farmacia.cidade} • {farmacia.avaliador}</p>
                    <p className="mt-1 text-xs text-slate-500">CNPJ {farmacia.cnpj}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-xs font-extrabold text-blue-950">{farmacia.notaGeral}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{farmacia.hora}</p>
                </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{farmacia.dataTexto}</p>
        </button>
    );
}

function FiltroSelect({ label, value, onChange, options }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>
            <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" value={value} onChange={(evento) => onChange(evento.target.value)}>
                <option value="">Todos</option>
                {options.map((option) => (
                    <option value={option} key={option}>{option}</option>
                ))}
            </select>
        </label>
    );
}

function FiltroData({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>
            <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="date" value={value} onChange={(evento) => onChange(evento.target.value)} />
            </div>
        </label>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ClipboardCheck, Clock, Filter, MapPin, Search, Star, UserRound } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { avaliacoes as avaliacoesMock } from '../../data/avaliacoes.js';
import { apiFetch } from '../../lib/api.js';
import { normalizarListaAvaliacoes } from '../../lib/avaliacoes.js';

export default function HistoricoAvaliacoes() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [data, setData] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');
    const [avaliacoesBase, setAvaliacoesBase] = useState([]);

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            setCarregando(true);
            setErroCarregar('');

            try {
                const resposta = await apiFetch('/api/avaliacoes');
                const lista = Array.isArray(resposta?.avaliacoes) ? resposta.avaliacoes : [];
                const normalizadas = lista.length > 0
                    ? normalizarListaAvaliacoes(lista, avaliacoesMock)
                    : normalizarListaAvaliacoes(avaliacoesMock, avaliacoesMock);

                if (ativo) {
                    setAvaliacoesBase(normalizadas);
                    if (lista.length === 0) {
                        setErroCarregar('Mostrando dados de exemplo até o backend retornar avaliações.');
                    }
                }
            } catch (error) {
                if (ativo) {
                    setAvaliacoesBase(normalizarListaAvaliacoes(avaliacoesMock, avaliacoesMock));
                    setErroCarregar('Não foi possível carregar o histórico real. Exibindo dados de exemplo.');
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregar();

        return () => {
            ativo = false;
        };
    }, []);

    const avaliacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return avaliacoesBase.filter((avaliacao) => {
            const texto = `${avaliacao.farmacia} ${avaliacao.cnpj} ${avaliacao.dataTexto} ${avaliacao.hora} ${avaliacao.avaliador} ${avaliacao.endereco}`.toLowerCase();
            const combinaBusca = termo ? texto.includes(termo) : true;
            const combinaData = data ? avaliacao.data === data : true;

            return combinaBusca && combinaData;
        });
    }, [avaliacoesBase, busca, data]);

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />

            <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4 pb-8 sm:max-w-3xl sm:px-6">
                <button className="flex w-fit items-center gap-2 rounded-md px-1 py-2 text-sm font-bold text-blue-900" type="button" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                    Histórico de Avaliações
                </button>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-2">
                        <label className="relative block flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                placeholder="Buscar por nome, CNPJ ou data"
                                value={busca}
                                onChange={(evento) => setBusca(evento.target.value)}
                            />
                        </label>

                        <button className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 text-blue-900 hover:border-sky-300" type="button" onClick={() => setMostrarFiltros(!mostrarFiltros)} aria-label="Filtros">
                            <Filter className="h-5 w-5" />
                        </button>
                    </div>

                    {mostrarFiltros && (
                        <label className="mt-3 block">
                            <span className="mb-2 block text-xs font-bold uppercase text-slate-500">Filtrar por data</span>
                            <div className="relative">
                                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
                            </div>
                        </label>
                    )}
                </section>

                {erroCarregar && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {erroCarregar}
                    </div>
                )}

                {carregando && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                        Carregando histórico...
                    </div>
                )}

                <section className="space-y-3">
                    {avaliacoesFiltradas.map((avaliacao) => (
                        <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-300" type="button" key={avaliacao.id} onClick={() => navigate(`/relatorio-avaliacao/${avaliacao.id}`)}>
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-700">
                                <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-extrabold text-blue-950">{avaliacao.farmacia}</h2>
                                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">CNPJ {avaliacao.cnpj}</p>
                                    </div>
                                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-800">
                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                        {avaliacao.notaGeral}
                                    </span>
                                </div>

                                <div className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{avaliacao.endereco}</span>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <span className="truncate">{avaliacao.avaliador}</span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        {avaliacao.dataTexto}
                                    </span>
                                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-800">
                                        {avaliacao.hora}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}

                    {!carregando && avaliacoesFiltradas.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                            Nenhuma avaliação encontrada.
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

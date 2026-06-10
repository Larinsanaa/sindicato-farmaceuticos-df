import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDownUp, ArrowLeft, CalendarDays, ChevronDown, ClipboardCheck, Clock,
    Filter, MapPin, Search, Star, UserRound, X
} from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { avaliacoes as avaliacoesMock } from '../../data/avaliacoes.js';
import { apiFetch, obterUsuarioLogado } from '../../lib/api.js';
import { normalizarListaAvaliacoes } from '../../lib/avaliacoes.js';

const filtrosIniciais = {
    cidade: '',
    avaliador: '',
    classificacao: '',
    dataInicio: '',
    dataFim: '',
    notaMinima: '',
    notaMaxima: '',
    ordenacao: 'recentes'
};

export default function HistoricoAvaliacoes() {
    const navigate = useNavigate();
    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const administrador = usuario?.tipo === 'presidente';
    const [busca, setBusca] = useState('');
    const [filtros, setFiltros] = useState(filtrosIniciais);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
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
                if (ativo) {
                    const reais = normalizarListaAvaliacoes(lista);
                    setAvaliacoesBase(administrador ? combinarComDemonstracao(reais) : reais);
                }
            } catch {
                if (ativo) {
                    setAvaliacoesBase(administrador ? normalizarListaAvaliacoes(avaliacoesMock, avaliacoesMock) : []);
                    setErroCarregar(administrador ? 'API indisponível. Exibindo dados administrativos de demonstração.' : '');
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregar();
        return () => { ativo = false; };
    }, [administrador]);

    const opcoes = useMemo(() => ({
        cidades: unicos(avaliacoesBase.map((item) => item.cidade)),
        avaliadores: unicos(avaliacoesBase.map((item) => item.avaliador)),
        classificacoes: unicos(avaliacoesBase.map((item) => item.classificacao))
    }), [avaliacoesBase]);

    const avaliacoesFiltradas = useMemo(() => {
        const termo = normalizarTexto(busca);
        const lista = avaliacoesBase.filter((item) => {
            const nota = obterNota(item);
            const texto = normalizarTexto([
                item.farmacia, item.cnpj, item.dataTexto, item.hora, item.avaliador,
                item.endereco, item.cidade, item.classificacao, item.resumo,
                ...(item.criterios || []).map((criterio) => criterio.nome)
            ].join(' '));

            return (!termo || texto.includes(termo))
                && (!filtros.cidade || item.cidade === filtros.cidade)
                && (!filtros.avaliador || item.avaliador === filtros.avaliador)
                && (!filtros.classificacao || item.classificacao === filtros.classificacao)
                && (!filtros.dataInicio || item.data >= filtros.dataInicio)
                && (!filtros.dataFim || item.data <= filtros.dataFim)
                && (!filtros.notaMinima || nota >= Number(filtros.notaMinima))
                && (!filtros.notaMaxima || nota <= Number(filtros.notaMaxima));
        });

        return [...lista].sort((a, b) => ordenar(a, b, filtros.ordenacao));
    }, [avaliacoesBase, busca, filtros]);

    const totalFiltrosAtivos = useMemo(
        () => Object.entries(filtros).filter(([campo, valor]) => campo !== 'ordenacao' && Boolean(valor)).length,
        [filtros]
    );

    const sugestoes = useMemo(() => {
        const termo = normalizarTexto(busca.trim());
        if (termo.length < 2) return [];

        const itens = avaliacoesBase.flatMap((item) => [
            { tipo: 'Farmácia', valor: item.farmacia, detalhe: item.cnpj },
            { tipo: 'CNPJ', valor: item.cnpj, detalhe: item.farmacia },
            { tipo: 'Avaliador', valor: item.avaliador, detalhe: item.farmacia },
            { tipo: 'Cidade', valor: item.cidade, detalhe: item.farmacia },
            { tipo: 'Classificação', valor: item.classificacao, detalhe: item.farmacia }
        ]).filter((item) => item.valor && normalizarTexto(item.valor).includes(termo));

        return [...new Map(itens.map((item) => [`${item.tipo}-${item.valor}`, item])).values()].slice(0, 8);
    }, [avaliacoesBase, busca]);

    function alterarFiltro(campo, valor) {
        setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    }

    function limparFiltros() {
        setBusca('');
        setFiltros(filtrosIniciais);
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />

            <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4 pb-8 sm:max-w-4xl sm:px-6">
                <button className="flex w-fit items-center gap-2 rounded-md px-1 py-2 text-sm font-bold text-blue-900" type="button" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" /> Histórico de Avaliações
                </button>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-lg font-extrabold text-blue-950">Pesquisar avaliações</h1>
                            <p className="mt-1 text-xs text-slate-500">{avaliacoesFiltradas.length} resultado(s) encontrado(s)</p>
                        </div>
                        <div className="flex gap-2">
                            {totalFiltrosAtivos > 0 && (
                                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-300" type="button" onClick={limparFiltros}>
                                    <X className="h-3.5 w-3.5" /> Limpar
                                </button>
                            )}
                            <button className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold ${mostrarFiltros || totalFiltrosAtivos > 0 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-blue-900'}`} type="button" onClick={() => setMostrarFiltros((atual) => !atual)} aria-expanded={mostrarFiltros}>
                                <Filter className="h-4 w-4" /> Filtros
                                {totalFiltrosAtivos > 0 && <span className="rounded bg-blue-700 px-1.5 py-0.5 text-[10px] text-white">{totalFiltrosAtivos}</span>}
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="Buscar farmácia, CNPJ, avaliador, cidade, classificação ou critério..."
                            value={busca}
                            onChange={(evento) => { setBusca(evento.target.value); setSugestoesAbertas(true); }}
                            onFocus={() => setSugestoesAbertas(true)}
                            onBlur={() => setTimeout(() => setSugestoesAbertas(false), 150)}
                            autoComplete="off"
                        />
                        {busca && <button className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100" type="button" onClick={() => setBusca('')} aria-label="Limpar pesquisa"><X className="h-3.5 w-3.5" /></button>}
                        {sugestoesAbertas && sugestoes.length > 0 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                                {sugestoes.map((sugestao) => (
                                    <button className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50" type="button" key={`${sugestao.tipo}-${sugestao.valor}`} onMouseDown={(evento) => evento.preventDefault()} onClick={() => { setBusca(sugestao.valor); setSugestoesAbertas(false); }}>
                                        <span className="min-w-0"><strong className="block truncate text-sm">{sugestao.valor}</strong><span className="block truncate text-xs text-slate-500">{sugestao.detalhe}</span></span>
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{sugestao.tipo}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {mostrarFiltros && (
                        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <FiltroSelect label="Cidade" valor={filtros.cidade} opcoes={opcoes.cidades} onChange={(valor) => alterarFiltro('cidade', valor)} />
                                {administrador && <FiltroSelect label="Avaliador" valor={filtros.avaliador} opcoes={opcoes.avaliadores} onChange={(valor) => alterarFiltro('avaliador', valor)} />}
                                <FiltroSelect label="Classificação" valor={filtros.classificacao} opcoes={opcoes.classificacoes} onChange={(valor) => alterarFiltro('classificacao', valor)} />
                                <FiltroSelect label="Ordenar" valor={filtros.ordenacao} onChange={(valor) => alterarFiltro('ordenacao', valor)} opcoesComValor={[['recentes', 'Mais recentes'], ['antigas', 'Mais antigas'], ['maiorNota', 'Maior nota'], ['menorNota', 'Menor nota'], ['farmacia', 'Farmácia A-Z']]} icone={<ArrowDownUp />} />
                                <FiltroData label="Data inicial" valor={filtros.dataInicio} onChange={(valor) => alterarFiltro('dataInicio', valor)} />
                                <FiltroData label="Data final" valor={filtros.dataFim} onChange={(valor) => alterarFiltro('dataFim', valor)} />
                                <FiltroNota label="Nota mínima" valor={filtros.notaMinima} onChange={(valor) => alterarFiltro('notaMinima', valor)} />
                                <FiltroNota label="Nota máxima" valor={filtros.notaMaxima} onChange={(valor) => alterarFiltro('notaMaxima', valor)} />
                            </div>
                        </div>
                    )}
                </section>

                {erroCarregar && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{erroCarregar}</div>}
                {carregando && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">Carregando histórico...</div>}

                <section className="space-y-3">
                    {avaliacoesFiltradas.map((avaliacao) => <AvaliacaoCard avaliacao={avaliacao} key={avaliacao.id} onClick={() => navigate(`/relatorio-avaliacao/${avaliacao.id}`)} />)}
                    {!carregando && avaliacoesFiltradas.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">Nenhuma avaliação encontrada.</div>}
                </section>
            </div>
        </main>
    );
}

function normalizarTexto(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function combinarComDemonstracao(reais) {
    const idsReais = new Set(reais.map((item) => String(item.id)));
    const demonstracao = normalizarListaAvaliacoes(
        avaliacoesMock.map((item) => ({ ...item, id: `demo-${item.id}`, demonstracao: true })),
        avaliacoesMock
    ).filter((item) => !idsReais.has(String(item.id)));

    return [...reais, ...demonstracao];
}

function obterNota(item) {
    return Number(String(item.notaGeral || 0).replace(',', '.')) || 0;
}

function unicos(lista) {
    return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function ordenar(a, b, ordem) {
    if (ordem === 'antigas') return String(a.data).localeCompare(String(b.data));
    if (ordem === 'maiorNota') return obterNota(b) - obterNota(a);
    if (ordem === 'menorNota') return obterNota(a) - obterNota(b);
    if (ordem === 'farmacia') return a.farmacia.localeCompare(b.farmacia, 'pt-BR');
    return String(b.data).localeCompare(String(a.data));
}

function FiltroSelect({ label, valor, opcoes = [], opcoesComValor, onChange, icone }) {
    return <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span><span className="relative block">{icone && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icone}</span>}<select className={`h-10 w-full rounded-md border border-slate-200 bg-white pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${icone ? 'pl-9' : 'px-3'}`} value={valor} onChange={(evento) => onChange(evento.target.value)}>{!opcoesComValor && <option value="">Todos</option>}{(opcoesComValor || opcoes.map((opcao) => [opcao, opcao])).map(([value, texto]) => <option value={value} key={value}>{texto}</option>)}</select></span></label>;
}

function FiltroData({ label, valor, onChange }) {
    return <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span><span className="relative block"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="date" value={valor} onChange={(evento) => onChange(evento.target.value)} /></span></label>;
}

function FiltroNota({ label, valor, onChange }) {
    return <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span><input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" min="1" max="5" step="0.1" type="number" value={valor} onChange={(evento) => onChange(evento.target.value)} placeholder="1,0 a 5,0" /></label>;
}

function AvaliacaoCard({ avaliacao, onClick }) {
    return (
        <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-300" type="button" onClick={onClick}>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-orange-100 text-orange-700"><ClipboardCheck className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="truncate text-sm font-extrabold text-blue-950">{avaliacao.farmacia}</h2><p className="mt-1 truncate text-xs font-semibold text-slate-500">CNPJ {avaliacao.cnpj}</p>{avaliacao.demonstracao && <span className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">Demonstração</span>}</div>
                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-800"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{avaliacao.notaGeral}</span>
                </div>
                <div className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{avaliacao.endereco}</span></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600"><span className="flex min-w-0 items-center gap-1.5"><UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{avaliacao.avaliador}</span></span><span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"><Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />{avaliacao.dataTexto}</span><span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-800">{avaliacao.hora}</span></div>
            </div>
        </button>
    );
}

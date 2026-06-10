import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, ArrowDownUp, Building2, CalendarDays, ChevronDown, ClipboardCheck, Download,
    Eye, FileSearch, Filter, Home, LogOut, PlusCircle, Search, Settings, Star, Store,
    UserPlus, UserRound, UsersRound, X
} from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import { apiFetch, limparSessao, obterUsuarioLogado } from '../lib/api.js';
import { normalizarDetalheAvaliacao, normalizarListaAvaliacoes } from '../lib/avaliacoes.js';
import { exportarAvaliacaoPdf } from '../lib/exportarRelatorio.js';

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

export default function Dashboard() {
    const navigate = useNavigate();
    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const administrador = usuario?.tipo === 'presidente';
    const [busca, setBusca] = useState('');
    const [filtros, setFiltros] = useState(filtrosIniciais);
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState('');
    const [filtrosAbertos, setFiltrosAbertos] = useState(false);
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            setCarregando(true);
            setMensagem('');

            try {
                const resposta = await apiFetch('/api/avaliacoes');
                const lista = Array.isArray(resposta?.avaliacoes) ? resposta.avaliacoes : [];
                if (ativo) setAvaliacoes(normalizarListaAvaliacoes(lista));
            } catch (error) {
                if (!ativo) return;

                setAvaliacoes([]);
                setMensagem('Não foi possível carregar as avaliações do backend. Verifique a API e a conexão.');
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregar();
        return () => { ativo = false; };
    }, [administrador]);

    const opcoes = useMemo(() => ({
        cidades: unicos(avaliacoes.map((item) => item.cidade)),
        avaliadores: unicos(avaliacoes.map((item) => item.avaliador)),
        classificacoes: unicos(avaliacoes.map((item) => item.classificacao))
    }), [avaliacoes]);

    const avaliacoesFiltradas = useMemo(() => {
        const termo = normalizarTexto(busca);
        const lista = avaliacoes.filter((item) => {
            const nota = obterNota(item);
            const textoGlobal = normalizarTexto([
                item.id, item.farmacia, item.cnpj, item.endereco, item.cidade, item.avaliador,
                item.classificacao, item.resumo, item.observacao, item.dataTexto, item.hora,
                ...(item.criterios || []).flatMap((criterio) => [criterio.nome, criterio.valor])
            ].join(' '));

            return (!termo || textoGlobal.includes(termo))
                && (!filtros.cidade || item.cidade === filtros.cidade)
                && (!filtros.avaliador || item.avaliador === filtros.avaliador)
                && (!filtros.classificacao || item.classificacao === filtros.classificacao)
                && (!filtros.dataInicio || item.data >= filtros.dataInicio)
                && (!filtros.dataFim || item.data <= filtros.dataFim)
                && (!filtros.notaMinima || nota >= Number(filtros.notaMinima))
                && (!filtros.notaMaxima || nota <= Number(filtros.notaMaxima));
        });

        return [...lista].sort((a, b) => ordenarAvaliacoes(a, b, filtros.ordenacao));
    }, [avaliacoes, busca, filtros]);

    const metricas = useMemo(() => {
        const notas = avaliacoes.map(obterNota).filter((nota) => nota > 0);
        return {
            total: avaliacoes.length,
            farmacias: new Set(avaliacoes.map((item) => item.cnpj).filter(Boolean)).size,
            avaliadores: new Set(avaliacoes.map((item) => item.avaliador).filter(Boolean)).size,
            media: notas.length ? (notas.reduce((soma, nota) => soma + nota, 0) / notas.length).toFixed(1).replace('.', ',') : '0,0',
            atencao: avaliacoes.filter((item) => obterNota(item) < 3.5).length
        };
    }, [avaliacoes]);

    const totalFiltrosAtivos = useMemo(
        () => Object.entries(filtros).filter(([campo, valor]) => campo !== 'ordenacao' && Boolean(valor)).length,
        [filtros]
    );

    const sugestoesBusca = useMemo(() => {
        const termo = normalizarTexto(busca.trim());
        if (termo.length < 2) return [];

        const sugestoes = avaliacoes.flatMap((item) => [
            { tipo: 'Farmácia', valor: item.farmacia, detalhe: item.cnpj },
            { tipo: 'CNPJ', valor: item.cnpj, detalhe: item.farmacia },
            { tipo: 'Avaliador', valor: item.avaliador, detalhe: item.farmacia },
            { tipo: 'Cidade', valor: item.cidade, detalhe: item.farmacia },
            { tipo: 'Classificação', valor: item.classificacao, detalhe: item.farmacia },
            ...(item.criterios || []).map((criterio) => ({ tipo: 'Critério', valor: criterio.nome, detalhe: item.farmacia }))
        ]).filter((item) => item.valor && normalizarTexto(item.valor).includes(termo));

        const unicas = [...new Map(sugestoes.map((item) => [`${item.tipo}-${item.valor}`, item])).values()];
        return unicas
            .sort((a, b) => {
                const aComeca = normalizarTexto(a.valor).startsWith(termo) ? 0 : 1;
                const bComeca = normalizarTexto(b.valor).startsWith(termo) ? 0 : 1;
                return aComeca - bComeca || a.valor.localeCompare(b.valor, 'pt-BR');
            })
            .slice(0, 8);
    }, [avaliacoes, busca]);

    function alterarFiltro(campo, valor) {
        setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    }

    function limparFiltros() {
        setBusca('');
        setFiltros(filtrosIniciais);
    }

    async function exportar(evento, avaliacao) {
        evento.stopPropagation();
        const janelaPdf = window.open('', '_blank', 'width=900,height=700');

        if (!janelaPdf) {
            setMensagem('Permita pop-ups no navegador para exportar o relatório.');
            return;
        }

        janelaPdf.document.write('<p style="font-family:Arial;padding:24px">Preparando relatório...</p>');

        try {
            const detalhe = await apiFetch(`/api/avaliacoes/${avaliacao.id}`);
            exportarAvaliacaoPdf(normalizarDetalheAvaliacao(detalhe, avaliacao), janelaPdf);
        } catch (error) {
            if (administrador && avaliacao) {
                exportarAvaliacaoPdf(avaliacao, janelaPdf);
                setMensagem('A API não retornou o detalhe completo. O PDF foi gerado com os dados disponíveis.');
                return;
            }
            janelaPdf.close();
            setMensagem(error.message);
        }
    }

    function sair() {
        limparSessao();
        navigate('/login');
    }

    return (
        <main className="min-h-dvh bg-slate-100 text-slate-900">
            <Cabecalho />

            <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 pb-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-7 lg:pb-7">
                <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 border-b border-slate-200 px-2 pb-4 pt-2">
                        <p className="text-xs font-bold uppercase text-slate-500">{administrador ? 'Administração' : 'Área do avaliador'}</p>
                        <p className="mt-1 truncate text-sm font-extrabold text-blue-950">{usuario?.nome || 'Usuário'}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{usuario?.email || ''}</p>
                    </div>
                    <nav className="grid grid-cols-4 gap-1 lg:block lg:space-y-1" aria-label="Menu principal">
                        <MenuItem ativo icone={<Home />} texto="Visão geral" />
                        <MenuItem icone={<ClipboardCheck />} texto="Avaliações" onClick={() => navigate('/historico-avaliacoes')} />
                        <MenuItem icone={<UserRound />} texto="Perfil" onClick={() => navigate('/perfil')} />
                        {administrador && <MenuItem icone={<UserPlus />} texto="Cadastrar avaliador" onClick={() => navigate('/cadastrar-avaliador')} />}
                        <MenuItem
                        icone={<Settings />}
                        texto="Config"
                        onClick={() => navigate('/configuracao')}/>
                        {!administrador && <MenuItem icone={<PlusCircle />} texto="Nova avaliação" onClick={() => navigate('/nova-avaliacao')} />}
                        <MenuItem className="hidden lg:flex" danger icone={<LogOut />} texto="Sair" onClick={sair} />
                    </nav>
                </aside>

                <div className="min-w-0 space-y-5">
                    <section className="border-b border-slate-300 pb-5">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase text-blue-700">{administrador ? 'Controle administrativo' : 'Minhas avaliações'}</p>
                                <h1 className="mt-1 text-2xl font-extrabold text-blue-950 sm:text-3xl">
                                    {administrador ? 'Visão geral das avaliações' : `Olá, ${usuario?.nome?.split(' ')[0] || 'avaliador'}`}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    {administrador
                                        ? 'Consulte todas as avaliações, identifique pontos de atenção e exporte relatórios.'
                                        : 'Acompanhe somente as avaliações realizadas por você.'}
                                </p>
                            </div>
                            {!administrador && (
                                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800" type="button" onClick={() => navigate('/nova-avaliacao')}>
                                    <PlusCircle className="h-4 w-4" /> Nova avaliação
                                </button>
                            )}
                        </div>
                    </section>

                    <section className={`grid gap-3 ${administrador ? 'grid-cols-2 xl:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
                        <Metrica icone={<ClipboardCheck />} titulo="Avaliações" valor={metricas.total} />
                        <Metrica icone={<Building2 />} titulo="Farmácias" valor={metricas.farmacias} />
                        {administrador && <Metrica icone={<UsersRound />} titulo="Avaliadores" valor={metricas.avaliadores} />}
                        <Metrica icone={<Star />} titulo="Média geral" valor={metricas.media} destaque />
                        <Metrica icone={<AlertTriangle />} titulo="Pontos de atenção" valor={metricas.atencao} alerta />
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-extrabold text-blue-950">Central de avaliações</h2>
                                    <p className="mt-1 text-xs text-slate-500">{avaliacoesFiltradas.length} resultado(s) encontrado(s)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {totalFiltrosAtivos > 0 && (
                                        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700" type="button" onClick={limparFiltros}>
                                            <X className="h-3.5 w-3.5" /> Limpar
                                        </button>
                                    )}
                                    <button
                                        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold transition ${filtrosAbertos || totalFiltrosAtivos > 0 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
                                        type="button"
                                        onClick={() => setFiltrosAbertos((abertos) => !abertos)}
                                        aria-expanded={filtrosAbertos}
                                        aria-controls="filtros-avaliacoes"
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                        Filtros
                                        {totalFiltrosAtivos > 0 && <span className="rounded bg-blue-700 px-1.5 py-0.5 text-[10px] text-white">{totalFiltrosAtivos}</span>}
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative mt-4">
                                <label className="sr-only" htmlFor="busca-avaliacoes">Pesquisar avaliações</label>
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    id="busca-avaliacoes"
                                    placeholder={administrador ? 'Pesquisar farmácia, CNPJ, avaliador, endereço, classificação, observação ou critério...' : 'Pesquisar nas suas avaliações...'}
                                    value={busca}
                                    onChange={(evento) => {
                                        setBusca(evento.target.value);
                                        setSugestoesAbertas(true);
                                    }}
                                    onFocus={() => setSugestoesAbertas(true)}
                                    onBlur={() => setTimeout(() => setSugestoesAbertas(false), 150)}
                                    autoComplete="off"
                                    aria-autocomplete="list"
                                    aria-expanded={sugestoesAbertas && sugestoesBusca.length > 0}
                                    aria-controls="sugestoes-busca"
                                />
                                {busca && (
                                    <button
                                        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        type="button"
                                        onMouseDown={(evento) => evento.preventDefault()}
                                        onClick={() => setBusca('')}
                                        aria-label="Limpar pesquisa"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                {sugestoesAbertas && sugestoesBusca.length > 0 && (
                                    <span className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white text-left shadow-xl" id="sugestoes-busca" role="listbox">
                                        {sugestoesBusca.map((sugestao) => (
                                            <button
                                                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"
                                                type="button"
                                                role="option"
                                                key={`${sugestao.tipo}-${sugestao.valor}`}
                                                onMouseDown={(evento) => evento.preventDefault()}
                                                onClick={() => {
                                                    setBusca(sugestao.valor);
                                                    setSugestoesAbertas(false);
                                                }}
                                            >
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-bold text-slate-800">{sugestao.valor}</span>
                                                    <span className="mt-0.5 block truncate text-xs text-slate-500">{sugestao.detalhe}</span>
                                                </span>
                                                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{sugestao.tipo}</span>
                                            </button>
                                        ))}
                                    </span>
                                )}
                            </div>

                            {filtrosAbertos && (
                                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3" id="filtros-avaliacoes">
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <FiltroSelect label="Cidade" valor={filtros.cidade} opcoes={opcoes.cidades} onChange={(valor) => alterarFiltro('cidade', valor)} />
                                        {administrador && <FiltroSelect label="Avaliador" valor={filtros.avaliador} opcoes={opcoes.avaliadores} onChange={(valor) => alterarFiltro('avaliador', valor)} />}
                                        <FiltroSelect label="Classificação" valor={filtros.classificacao} opcoes={opcoes.classificacoes} onChange={(valor) => alterarFiltro('classificacao', valor)} />
                                        <FiltroSelect label="Ordenar" valor={filtros.ordenacao} onChange={(valor) => alterarFiltro('ordenacao', valor)} opcoesComValor={[
                                            ['recentes', 'Mais recentes'], ['antigas', 'Mais antigas'], ['maiorNota', 'Maior nota'], ['menorNota', 'Menor nota'], ['farmacia', 'Farmácia A-Z']
                                        ]} icone={<ArrowDownUp />} />
                                        <FiltroData label="Data inicial" valor={filtros.dataInicio} onChange={(valor) => alterarFiltro('dataInicio', valor)} />
                                        <FiltroData label="Data final" valor={filtros.dataFim} onChange={(valor) => alterarFiltro('dataFim', valor)} />
                                        <FiltroNota label="Nota mínima" valor={filtros.notaMinima} onChange={(valor) => alterarFiltro('notaMinima', valor)} />
                                        <FiltroNota label="Nota máxima" valor={filtros.notaMaxima} onChange={(valor) => alterarFiltro('notaMaxima', valor)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {mensagem && <div className="m-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{mensagem}</div>}
                        {carregando && <EstadoVazio icone={<FileSearch />} texto="Carregando avaliações..." />}

                        {!carregando && (
                            <>
                                <div className="space-y-3 p-4 sm:hidden">
                                    {avaliacoesFiltradas.map((avaliacao) => (
                                        <AvaliacaoCard key={avaliacao.id} avaliacao={avaliacao} onAbrir={() => navigate(`/relatorio-avaliacao/${avaliacao.id}`)} onExportar={(evento) => exportar(evento, avaliacao)} />
                                    ))}
                                </div>

                                <div className="hidden overflow-x-auto sm:block">
                                    <table className="w-full min-w-[900px] text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3 font-bold">Farmácia</th>
                                                {administrador && <th className="px-4 py-3 font-bold">Avaliador</th>}
                                                <th className="px-4 py-3 font-bold">Localização</th>
                                                <th className="px-4 py-3 font-bold">Data</th>
                                                <th className="px-4 py-3 text-center font-bold">Nota</th>
                                                <th className="px-5 py-3 text-right font-bold">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {avaliacoesFiltradas.map((avaliacao) => (
                                                <tr className="border-t border-slate-100 hover:bg-slate-50" key={avaliacao.id}>
                                                    <td className="px-5 py-4">
                                                        <p className="font-extrabold text-blue-950">{avaliacao.farmacia}</p>
                                                        <p className="mt-1 text-xs text-slate-500">CNPJ {avaliacao.cnpj}</p>
                                                        <Classificacao avaliacao={avaliacao} />
                                                    </td>
                                                    {administrador && <td className="px-4 py-4 text-slate-700">{avaliacao.avaliador}</td>}
                                                    <td className="max-w-[230px] px-4 py-4 text-slate-600">
                                                        <p className="truncate">{avaliacao.cidade || 'Não informada'}</p>
                                                        <p className="mt-1 truncate text-xs text-slate-400">{avaliacao.endereco}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-600">{avaliacao.dataTexto}<p className="mt-1 text-xs text-slate-400">{avaliacao.hora}</p></td>
                                                    <td className="px-4 py-4 text-center"><Nota valor={avaliacao.notaGeral} /></td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Acao icone={<Eye />} titulo="Visualizar" onClick={() => navigate(`/relatorio-avaliacao/${avaliacao.id}`)} />
                                                            <Acao icone={<Download />} titulo="Exportar PDF" onClick={(evento) => exportar(evento, avaliacao)} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {!carregando && avaliacoesFiltradas.length === 0 && <EstadoVazio icone={<FileSearch />} texto="Nenhuma avaliação corresponde aos filtros selecionados." />}
                    </section>
                </div>
            </div>
        </main>
    );
}

function normalizarTexto(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function obterNota(item) {
    return Number(String(item.notaGeral || 0).replace(',', '.')) || 0;
}

function unicos(lista) {
    return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function ordenarAvaliacoes(a, b, ordem) {
    if (ordem === 'antigas') return String(a.data).localeCompare(String(b.data));
    if (ordem === 'maiorNota') return obterNota(b) - obterNota(a);
    if (ordem === 'menorNota') return obterNota(a) - obterNota(b);
    if (ordem === 'farmacia') return a.farmacia.localeCompare(b.farmacia, 'pt-BR');
    return String(b.data).localeCompare(String(a.data));
}

function MenuItem({ icone, texto, ativo, danger, onClick, className = '' }) {
    return (
        <button className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md px-2 text-[10px] font-bold lg:min-h-10 lg:flex-row lg:justify-start lg:gap-2 lg:text-sm ${ativo ? 'bg-blue-700 text-white' : danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'} ${className}`} type="button" onClick={onClick}>
            <span className="[&_svg]:h-4 [&_svg]:w-4">{icone}</span><span>{texto}</span>
        </button>
    );
}

function Metrica({ icone, titulo, valor, destaque, alerta }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`grid h-8 w-8 place-items-center rounded-md ${alerta ? 'bg-amber-100 text-amber-700' : destaque ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'} [&_svg]:h-4 [&_svg]:w-4`}>{icone}</div>
            <p className="mt-4 text-xs font-bold uppercase text-slate-500">{titulo}</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-950">{valor}</p>
        </div>
    );
}

function FiltroSelect({ label, valor, opcoes = [], opcoesComValor, onChange, icone }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span>
            <span className="relative block">
                {icone && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icone}</span>}
                <select className={`h-10 w-full rounded-md border border-slate-200 bg-white pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${icone ? 'pl-9' : 'px-3'}`} value={valor} onChange={(evento) => onChange(evento.target.value)}>
                    {!opcoesComValor && <option value="">Todos</option>}
                    {(opcoesComValor || opcoes.map((opcao) => [opcao, opcao])).map(([value, texto]) => <option value={value} key={value}>{texto}</option>)}
                </select>
            </span>
        </label>
    );
}

function FiltroData({ label, valor, onChange }) {
    return (
        <label>
            <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span>
            <span className="relative block">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="date" value={valor} onChange={(evento) => onChange(evento.target.value)} />
            </span>
        </label>
    );
}

function FiltroNota({ label, valor, onChange }) {
    return (
        <label>
            <span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{label}</span>
            <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" min="1" max="5" step="0.1" type="number" value={valor} onChange={(evento) => onChange(evento.target.value)} placeholder="1,0 a 5,0" />
        </label>
    );
}

function Nota({ valor }) {
    const alerta = obterNota({ notaGeral: valor }) < 3.5;
    return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-extrabold ${alerta ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-800'}`}><Star className="h-3.5 w-3.5 fill-current" />{valor}</span>;
}

function Classificacao({ avaliacao }) {
    return <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{avaliacao.classificacao}</span>;
}

function Acao({ icone, titulo, onClick }) {
    return <button className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 [&_svg]:h-4 [&_svg]:w-4" type="button" title={titulo} aria-label={titulo} onClick={onClick}>{icone}</button>;
}

function AvaliacaoCard({ avaliacao, onAbrir, onExportar }) {
    return (
        <article className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="truncate font-extrabold text-blue-950">{avaliacao.farmacia}</h3><p className="mt-1 truncate text-xs text-slate-500">CNPJ {avaliacao.cnpj}</p></div>
                <Nota valor={avaliacao.notaGeral} />
            </div>
            <p className="mt-3 text-xs text-slate-600">{avaliacao.avaliador} · {avaliacao.dataTexto}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{avaliacao.endereco}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-700 text-xs font-bold text-white" type="button" onClick={onAbrir}><Eye className="h-4 w-4" /> Visualizar</button>
                <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-bold text-blue-700" type="button" onClick={onExportar}><Download className="h-4 w-4" /> PDF</button>
            </div>
        </article>
    );
}

function EstadoVazio({ icone, texto }) {
    return <div className="m-4 grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500"><div><span className="mx-auto mb-2 block w-fit [&_svg]:h-5 [&_svg]:w-5">{icone}</span>{texto}</div></div>;
}

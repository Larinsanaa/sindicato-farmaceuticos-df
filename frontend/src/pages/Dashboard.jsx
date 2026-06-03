import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Home, LogOut, PlusCircle, Settings, SlidersHorizontal, Star, Store, UserRound, X } from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import { avaliacoes as avaliacoesMock } from '../data/avaliacoes.js';
import { apiFetch, limparSessao, obterUsuarioLogado } from '../lib/api.js';
import { normalizarListaAvaliacoes } from '../lib/avaliacoes.js';

export default function Dashboard() {
    const navigate = useNavigate();
    const [buscaFarmacia, setBuscaFarmacia] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');
    const [avaliacoesBase, setAvaliacoesBase] = useState([]);
    const [menuAberto, setMenuAberto] = useState(false);
    const [filtros, setFiltros] = useState({
        cidade: '',
        avaliador: '',
        dataInicio: '',
        dataFim: '',
        notaMinima: ''
    });

    // Fecha o menu dropdown ao clicar em qualquer lugar fora da tela
    useEffect(() => {
        if (!menuAberto) return;

        function fecharMenuAoClicarFora() {
            setMenuAberto(false);
        }

        const timer = setTimeout(() => {
            window.addEventListener('click', fecharMenuAoClicarFora);
        }, 0);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', fecharMenuAoClicarFora);
        };
    }, [menuAberto]);

    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const tipoUsuario = usuario?.tipo || 'avaliador';
   
    useEffect(() => {
        let ativo = true;

        async function carregarAvaliacoes() {
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
                    setErroCarregar('Não foi possível carregar as avaliações reais. Exibindo dados de exemplo.');
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarAvaliacoes();

        return () => {
            ativo = false;
        };
    }, []);

    const farmaciasFiltradas = useMemo(() => {
        const termo = buscaFarmacia.trim().toLowerCase();

        return avaliacoesBase.filter((avaliacao) => {
            const texto = `${avaliacao.farmacia} ${avaliacao.cnpj} ${avaliacao.endereco} ${avaliacao.cidade} ${avaliacao.avaliador} ${avaliacao.dataTexto} ${avaliacao.hora}`.toLowerCase();
            const nota = Number(String(avaliacao.notaGeral).replace(',', '.'));
            const combinaBusca = termo ? texto.includes(termo) : true;
            const combinaCidade = filtros.cidade ? avaliacao.cidade === filtros.cidade : true;
            const combinaAvaliador = filtros.avaliador ? avaliacao.avaliador === filtros.avaliador : true;
            const combinaDataInicio = filtros.dataInicio ? avaliacao.data >= filtros.dataInicio : true;
            const combinaDataFim = filtros.dataFim ? avaliacao.data <= filtros.dataFim : true;
            const combinaNota = filtros.notaMinima ? nota >= Number(filtros.notaMinima) : true;

            return combinaBusca && combinaCidade && combinaAvaliador && combinaDataInicio && combinaDataFim && combinaNota;
        });
    }, [avaliacoesBase, buscaFarmacia, filtros]);

    const cidades = useMemo(() => [...new Set(avaliacoesBase.map((avaliacao) => avaliacao.cidade).filter(Boolean))], [avaliacoesBase]);
    const avaliadores = useMemo(() => [...new Set(avaliacoesBase.map((avaliacao) => avaliacao.avaliador).filter(Boolean))], [avaliacoesBase]);

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
        limparSessao();
        navigate('/');
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <div className="relative">
                <Cabecalho menuAberto={menuAberto} setMenuAberto={setMenuAberto} />
                
                {menuAberto && (
                    <div 
                        className="absolute right-6 top-[58px] z-50 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MenuItem ativo icone={<Home />} texto="Início" onClick={() => setMenuAberto(false)} />

                        <MenuItem
                            icone={<Store />}
                            texto="Farmácias"
                            onClick={() => setMenuAberto(false)}
                        />

                        <MenuItem
                            icone={<ClipboardCheck />}
                            texto="Avaliações"
                            onClick={() => { navigate('/historico-avaliacoes'); setMenuAberto(false); }}
                        />

                        {tipoUsuario === 'avaliador' && (
                            <MenuItem
                                icone={<PlusCircle />}
                                texto="Nova avaliação"
                                onClick={() => { navigate('/nova-avaliacao'); setMenuAberto(false); }}
                            />
                        )}

                        <MenuItem
                            icone={<UserRound />}
                            texto="Perfil"
                            onClick={() => { navigate('/perfil'); setMenuAberto(false); }}
                        />

                        <MenuItem
                            icone={<Settings />}
                            texto="Config"
                            onClick={() => setMenuAberto(false)}
                        />

                        <MenuItem
                            danger
                            icone={<LogOut />}
                            texto="Sair"
                            onClick={sair}
                        />
                    </div>
                )}
            </div>

            {/* Layout principal limpo sem a barra lateral antiga */}
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 pb-24 sm:px-6 lg:py-8 lg:pb-8">
                
                {/* Seção Bem-vindo */}
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <p className="text-xs font-bold uppercase text-blue-900/70 sm:text-sm">Dashboard</p>
                    <div className="mt-2 grid gap-3 sm:flex sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold leading-tight text-blue-950 sm:text-3xl">Bem-vindo(a)</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Acompanhe as farmácias e avaliações cadastradas no sistema.
                            </p>
                        </div>
                        {tipoUsuario === 'avaliador' && (
                            <button className="hidden rounded-md bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 sm:inline-flex" type="button" onClick={() => navigate('/nova-avaliacao')}>
                                Nova avaliação
                            </button>
                        )}
                    </div>
                </section>

                {/* Seção de Cards Indicadores */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Card titulo="Avaliações" valor={String(avaliacoesBase.length || avaliacoesMock.length)} />
                    <Card titulo="Farmácias" valor={String(new Set(avaliacoesBase.map((item) => item.cnpj)).size || new Set(avaliacoesMock.map((item) => item.cnpj)).size)} />
                    <Card titulo="Média geral" valor={calcularMedia(avaliacoesBase.length > 0 ? avaliacoesBase : normalizarListaAvaliacoes(avaliacoesMock, avaliacoesMock))} estrela destaque />
                </section>

                {/* Seção Principal de Listagem */}
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Últimas farmácias</h2>
                            <p className="text-sm text-slate-500">Dados reais do backend quando disponíveis. Exemplo local como fallback.</p>
                        </div>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600" aria-live="polite">
                            {farmaciasFiltradas.length} de {avaliacoesBase.length || avaliacoesMock.length}
                        </span>
                    </div>

                    {/* Barra de Busca e Botão de Filtros */}
                    <div className="mb-4 flex items-center gap-2 border-y border-slate-200 py-3">
                        <button 
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border text-slate-600 hover:border-sky-300 hover:text-blue-700 ${mostrarFiltros ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200'}`} 
                            type="button" 
                            aria-label="Mostrar ou ocultar filtros" 
                            aria-controls="filtros-dashboard" 
                            aria-expanded={mostrarFiltros} 
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <label className="relative block min-w-0 flex-1">
                            <span className="sr-only">Buscar farmácia, endereço ou data</span>
                            <input
                                className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                placeholder="Buscar farmácia, endereço ou data"
                                value={buscaFarmacia}
                                onChange={(evento) => setBuscaFarmacia(evento.target.value)}
                            />
                        </label>
                    </div>

                    {/* NOVO LOCAL DO FILTRO: Acoplado perfeitamente abaixo da barra de buscas */}
                    {mostrarFiltros && (
                        <aside className="mb-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200" id="filtros-dashboard">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Filtrar Resultados</h3>
                                <button
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-blue-800 focus:outline-none"
                                    type="button"
                                    onClick={limparFiltros}
                                    aria-label="Limpar todos os filtros"
                                >
                                    <X className="h-3 w-3" />
                                    Limpar Filtros
                                </button>
                            </div>

                            {/* Grid responsiva: 1 coluna no celular, 5 colunas lado a lado no PC */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <FiltroSelect label="Cidade" value={filtros.cidade} onChange={(valor) => alterarFiltro('cidade', valor)} options={cidades} />
                                <FiltroSelect label="Avaliador" value={filtros.avaliador} onChange={(valor) => alterarFiltro('avaliador', valor)} options={avaliadores} />
                                <FiltroData label="Data inicial" value={filtros.dataInicio} onChange={(valor) => alterarFiltro('dataInicio', valor)} />
                                <FiltroData label="Data final" value={filtros.dataFim} onChange={(valor) => alterarFiltro('dataFim', valor)} />

                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nota mínima</span>
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

                    {erroCarregar && (
                        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                            {erroCarregar}
                        </div>
                    )}

                    {carregando && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                            Carregando avaliações...
                        </div>
                    )}

                    {/* Cards Mobile */}
                    <div className="space-y-3 sm:hidden">
                        {farmaciasFiltradas.map((farmacia) => (
                            <FarmaciaCard farmacia={farmacia} key={farmacia.id} onClick={() => abrirRelatorio(farmacia.id)} />
                        ))}
                    </div>

                    {/* Tabela Desktop */}
                    <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <caption className="sr-only">Últimas farmácias avaliadas. Clique em uma linha para abrir o relatório da avaliação.</caption>
                            <thead className="border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="w-[30%] px-3 py-3 font-bold" scope="col">Farmácia</th>
                                    <th className="w-[18%] px-3 py-3 font-bold" scope="col">Avaliador</th>
                                    <th className="w-[18%] px-3 py-3 font-bold" scope="col">Endereço</th>
                                    <th className="w-[10%] px-3 py-3 text-center font-bold" scope="col">Média</th>
                                    <th className="w-[24%] px-3 py-3 font-bold" scope="col">Avaliado em</th>
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
                                        aria-label={`Abrir relatório de ${farmacia.farmacia}, avaliada por ${farmacia.avaliador} em ${farmacia.dataTexto}`}
                                    >
                                        <td className="px-3 py-3">
                                            <p className="font-semibold text-slate-800">{farmacia.farmacia}</p>
                                            <p className="text-xs text-slate-500">CNPJ {farmacia.cnpj}</p>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">{farmacia.avaliador}</td>
                                        <td className="px-3 py-3 text-slate-600">{farmacia.endereco}</td>
                                        <td className="px-3 py-3 text-center font-bold text-blue-950">{farmacia.notaGeral}</td>
                                        <td className="px-3 py-3 text-slate-600">{farmacia.dataTexto}, {farmacia.hora}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!carregando && farmaciasFiltradas.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                            Nenhuma farmácia encontrada.
                        </div>
                    )}
                </section>
            </div>

            {tipoUsuario === 'avaliador' && (
                <button
                    className="fixed bottom-4 left-4 right-4 z-10 flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-800 sm:hidden"
                    type="button"
                    onClick={() => navigate('/nova-avaliacao')}
                >
                    <PlusCircle className="h-5 w-5" />
                    Nova avaliação
                </button>
            )}
        </main>
    );
}

function calcularMedia(lista) {
    if (!lista || lista.length === 0) {
        return '0,0';
    }
    const total = lista.reduce((soma, item) => soma + Number(String(item.notaGeral).replace(',', '.')) || 0, 0);
    return (total / lista.length).toFixed(1).replace('.', ',');
}

function MenuItem({ icone, texto, ativo = false, danger = false, onClick, className = '' }) {
    const estiloBase = danger
        ? 'text-red-600 hover:bg-red-50 active:bg-red-200'
        : ativo
            ? 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900'
            : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200/80';

    return (
        <button 
            className={`
                flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold 
                transition-colors duration-75 select-none touch-manipulation
                ${estiloBase} \${className}
            `} 
            type="button" 
            onClick={onClick} 
            aria-current={ativo ? 'page' : undefined}
        >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                {icone}
            </span>
            <span className="truncate">{texto}</span>
        </button>
    );
}

function Card({ titulo, valor, estrela = false, destaque = false }) {
    return (
        <div className={`rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm \${destaque ? 'col-span-2 sm:col-span-1' : ''}`}>
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
        <button className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-sky-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" type="button" onClick={onClick}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{farmacia.farmacia}</h3>
                    <p className="mt-1 text-xs text-slate-500">{farmacia.cidade ? `\${farmacia.cidade} • \${farmacia.avaliador}` : farmacia.avaliador}</p>
                    <p className="mt-1 text-xs text-slate-500">CNPJ {farmacia.cnpj}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-xs font-extrabold text-blue-950">★ {farmacia.notaGeral}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{farmacia.hora}</p>
                </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{farmacia.endereco}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{farmacia.dataTexto}</p>
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

// Corrigido para fechar a tag de abertura adequadamente
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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle2,
    CircleDashed,
    Copy,
    LayoutDashboard,
    Search,
    Shield,
    User,
    UserCheck,
    UsersRound,
    UserX,
    X
} from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch, obterUsuarioLogado } from '../../lib/api.js';

const avaliadoresDemo = [
    {
        id: 'demo-1',
        nome: 'Carla Menezes',
        cpf: '12345678901',
        email: 'carla.menezes@demonstracao.com.br',
        status: 'Ativo',
        regioes: 'Plano Piloto e Asa Norte',
        avaliacoes: 18,
        demonstracao: true
    },
    {
        id: 'demo-2',
        nome: 'Rafael Nunes',
        cpf: '98765432100',
        email: 'rafael.nunes@demonstracao.com.br',
        status: 'Pendente',
        regioes: 'Taguatinga e Ceilândia',
        avaliacoes: 0,
        demonstracao: true
    },
    {
        id: 'demo-3',
        nome: 'Patrícia Lima',
        cpf: '45678912300',
        email: 'patricia.lima@demonstracao.com.br',
        status: 'Inativo',
        regioes: 'Sobradinho e Planaltina',
        avaliacoes: 7,
        demonstracao: true
    }
];

export default function Configuracao() {
    const navigate = useNavigate();
    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const administrador = usuario?.tipo === 'presidente';
    const [abaAtiva, setAbaAtiva] = useState('perfil');
    const [notificacao, setNotificacao] = useState({ texto: '', tipo: '' });
    const [busca, setBusca] = useState('');
    const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
    const [avaliadores, setAvaliadores] = useState(avaliadoresDemo);
    const [avaliadorSelecionadoId, setAvaliadorSelecionadoId] = useState(avaliadoresDemo[0]?.id || '');
    const [carregandoAvaliadores, setCarregandoAvaliadores] = useState(false);
    const [gerandoLinkId, setGerandoLinkId] = useState('');

    useEffect(() => {
        if (!administrador) return;
        carregarAvaliadores();
    }, [administrador]);

    async function carregarAvaliadores() {
        setCarregandoAvaliadores(true);

        try {
            const resposta = await apiFetch('/api/avaliadores');
            const reais = Array.isArray(resposta?.avaliadores)
                ? resposta.avaliadores.map((item) => ({
                    id: `real-${item.id}`,
                    backendId: item.id,
                    nome: item.nome,
                    cpf: item.cpf,
                    email: item.email,
                    status: item.ativo === false ? 'Inativo' : 'Ativo',
                    regioes: 'Não definido',
                    avaliacoes: item.total_avaliacoes || 0,
                    demonstracao: false
                }))
                : [];

            setAvaliadores([...reais, ...avaliadoresDemo]);
            setAvaliadorSelecionadoId((atual) => atual || reais[0]?.id || avaliadoresDemo[0]?.id || '');
        } catch (error) {
            setNotificacao({ texto: error.message, tipo: 'erro' });
        } finally {
            setCarregandoAvaliadores(false);
        }
    }

    const avaliadoresFiltrados = useMemo(() => {
        const termo = normalizar(busca);
        if (!termo) return avaliadores;

        return avaliadores.filter((avaliador) => normalizar([
            avaliador.nome,
            avaliador.cpf,
            avaliador.email,
            avaliador.status,
            avaliador.regioes
        ].join(' ')).includes(termo));
    }, [avaliadores, busca]);

    const sugestoes = useMemo(() => {
        const termo = normalizar(busca);
        if (termo.length < 2) return [];

        return avaliadores
            .filter((avaliador) => normalizar(`${avaliador.nome} ${avaliador.cpf} ${avaliador.email}`).includes(termo))
            .slice(0, 6);
    }, [avaliadores, busca]);

    const avaliadorSelecionado = useMemo(
        () => avaliadores.find((item) => item.id === avaliadorSelecionadoId) || avaliadoresFiltrados[0] || null,
        [avaliadores, avaliadoresFiltrados, avaliadorSelecionadoId]
    );

    async function alternarStatus(avaliador) {
        const novoStatus = avaliador.status === 'Ativo' ? 'Inativo' : 'Ativo';
        const ativo = novoStatus === 'Ativo';

        if (!avaliador.demonstracao && avaliador.backendId) {
            try {
                await apiFetch(`/api/avaliadores/${avaliador.backendId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ ativo })
                });
            } catch (error) {
                setNotificacao({ texto: error.message, tipo: 'erro' });
                return;
            }
        }

        setAvaliadores((atuais) => atuais.map((item) => (
            item.id === avaliador.id ? { ...item, status: novoStatus } : item
        )));
        setNotificacao({ texto: `${avaliador.nome} agora está ${novoStatus.toLowerCase()}.`, tipo: 'sucesso' });
    }

    async function gerarLink(avaliador) {
        setGerandoLinkId(avaliador.id);

        try {
            const link = avaliador.demonstracao
                ? `${window.location.origin}/redefinir-senha?token=demo-${encodeURIComponent(avaliador.id)}`
                : await gerarLinkReal(avaliador);

            await navigator.clipboard.writeText(link);
            setNotificacao({ texto: `Link de acesso de ${avaliador.nome} copiado.`, tipo: 'sucesso' });
        } catch (error) {
            setNotificacao({ texto: error.message, tipo: 'erro' });
        } finally {
            setGerandoLinkId('');
        }
    }

    async function gerarLinkReal(avaliador) {
        if (!avaliador.backendId) {
            throw new Error('Não foi possível identificar o avaliador selecionado.');
        }

        const resposta = await apiFetch(`/api/avaliadores/${avaliador.backendId}/link-redefinicao`, { method: 'POST' });
        return `${window.location.origin}/redefinir-senha?token=${encodeURIComponent(resposta.token)}`;
    }

    return (
        <main className="min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900">
            <Cabecalho />

            <div className="mx-auto w-full max-w-[1440px] px-4 py-5 pb-32 sm:px-6 lg:px-7 lg:pb-7">
                {notificacao.texto && (
                    <div className={`mb-4 flex items-center gap-2 rounded-lg border p-4 text-sm font-semibold shadow-sm ${
                        notificacao.tipo === 'sucesso' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                    }`}>
                        {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        {notificacao.texto}
                    </div>
                )}

                <div className="grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <aside className="hidden h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:block">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Configurações</h2>
                        <nav className="space-y-1" aria-label="Menu de configurações">
                            <MenuItem ativo={abaAtiva === 'perfil'} texto="Perfil" icone={<User />} onClick={() => setAbaAtiva('perfil')} />
                            <MenuItem ativo={abaAtiva === 'permissoes'} texto="Permissões" icone={<Shield />} onClick={() => setAbaAtiva('permissoes')} />
                            {administrador && <MenuItem ativo={abaAtiva === 'avaliadores'} texto="Gestão de avaliadores" icone={<UsersRound />} onClick={() => setAbaAtiva('avaliadores')} />}
                            <MenuItem texto="Dashboard" icone={<LayoutDashboard />} onClick={() => navigate('/dashboard')} />
                        </nav>
                    </aside>

                    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
                            <Tab ativo={abaAtiva === 'perfil'} texto="Perfil" onClick={() => setAbaAtiva('perfil')} />
                            <Tab ativo={abaAtiva === 'permissoes'} texto="Permissões" onClick={() => setAbaAtiva('permissoes')} />
                            {administrador && <Tab ativo={abaAtiva === 'avaliadores'} texto="Avaliadores" onClick={() => setAbaAtiva('avaliadores')} />}
                        </div>

                        {abaAtiva === 'perfil' && (
                            <SecaoPerfil usuario={usuario} administrador={administrador} />
                        )}

                        {abaAtiva === 'permissoes' && (
                            <SecaoPermissoes administrador={administrador} />
                        )}

                        {abaAtiva === 'avaliadores' && administrador && (
                            <SecaoAvaliadores
                                avaliadores={avaliadoresFiltrados}
                                avaliadorSelecionado={avaliadorSelecionado}
                                busca={busca}
                                carregando={carregandoAvaliadores}
                                gerandoLinkId={gerandoLinkId}
                                sugestoes={sugestoes}
                                sugestoesAbertas={sugestoesAbertas}
                                onAlternarStatus={alternarStatus}
                                onBuscar={setBusca}
                                onFecharSugestoes={() => setSugestoesAbertas(false)}
                                onFocarBusca={() => setSugestoesAbertas(true)}
                                onGerarLink={gerarLink}
                                onSelecionar={(avaliador) => {
                                    setAvaliadorSelecionadoId(avaliador.id);
                                    setBusca('');
                                    setSugestoesAbertas(false);
                                }}
                            />
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

function SecaoPerfil({ usuario, administrador }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase text-blue-700">Conta</p>
            <h1 className="mt-1 text-2xl font-extrabold text-blue-950">Configurações do perfil</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Consulte os dados principais da conta e o nível de acesso atual.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Info label="Nome" value={usuario?.nome || 'Usuário'} />
                <Info label="E-mail" value={usuario?.email || 'Não informado'} />
                <Info label="Perfil" value={administrador ? 'Administrador' : 'Avaliador'} />
                <Info label="Acesso" value={administrador ? 'Gestão administrativa' : 'Avaliações próprias'} />
            </div>
        </div>
    );
}

function SecaoPermissoes({ administrador }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase text-blue-700">Permissões</p>
            <h1 className="mt-1 text-2xl font-extrabold text-blue-950">Escopo de acesso</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">As permissões refletem o tipo de conta autenticada no sistema.</p>

            <div className="mt-6 grid gap-3">
                {administrador ? (
                    <>
                        <Permissao texto="Visualizar avaliações de todos os avaliadores" ativo />
                        <Permissao texto="Cadastrar avaliadores e gerar links de senha" ativo />
                        <Permissao texto="Ativar ou desativar avaliadores" ativo />
                        <Permissao texto="Criar avaliações de campo" ativo={false} />
                    </>
                ) : (
                    <>
                        <Permissao texto="Visualizar somente as próprias avaliações" ativo />
                        <Permissao texto="Criar novas avaliações de campo" ativo />
                        <Permissao texto="Gerenciar avaliadores" ativo={false} />
                    </>
                )}
            </div>
        </div>
    );
}

function SecaoAvaliadores({
    avaliadores,
    avaliadorSelecionado,
    busca,
    carregando,
    gerandoLinkId,
    sugestoes,
    sugestoesAbertas,
    onAlternarStatus,
    onBuscar,
    onFecharSugestoes,
    onFocarBusca,
    onGerarLink,
    onSelecionar
}) {
    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase text-blue-700">Administração</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-blue-950">Gestão de avaliadores</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Acompanhe status, dados de acesso e controle operacional dos avaliadores.</p>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                    {avaliadores.length} registro(s)
                </span>
            </div>

            <div className="relative mt-5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Buscar por nome, CPF, e-mail ou status"
                    value={busca}
                    onBlur={() => setTimeout(onFecharSugestoes, 150)}
                    onChange={(evento) => {
                        onBuscar(evento.target.value);
                        onFocarBusca();
                    }}
                    onFocus={onFocarBusca}
                    autoComplete="off"
                />
                {busca && (
                    <button className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100" type="button" onClick={() => onBuscar('')} aria-label="Limpar busca">
                        <X className="h-4 w-4" />
                    </button>
                )}
                {sugestoesAbertas && sugestoes.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                        {sugestoes.map((avaliador) => (
                            <button key={avaliador.id} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50" type="button" onMouseDown={(evento) => evento.preventDefault()} onClick={() => onSelecionar(avaliador)}>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-slate-800">{avaliador.nome}</span>
                                    <span className="block truncate text-xs text-slate-500">CPF {formatarCpf(avaliador.cpf)}</span>
                                </span>
                                <StatusBadge status={avaliador.status} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-3 md:hidden">
                    {carregando && <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Carregando avaliadores...</p>}
                    {!carregando && avaliadores.map((avaliador) => (
                        <button
                            key={avaliador.id}
                            className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50"
                            type="button"
                            onClick={() => onSelecionar(avaliador)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-extrabold text-blue-950">{avaliador.nome}</span>
                                    <span className="mt-1 block text-xs font-semibold text-slate-500">CPF {formatarCpf(avaliador.cpf)}</span>
                                    <span className="mt-1 block truncate text-xs text-slate-500">{avaliador.email}</span>
                                </span>
                                <StatusBadge status={avaliador.status} />
                            </div>
                        </button>
                    ))}
                    {!carregando && avaliadores.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Nenhum avaliador encontrado.</p>}
                </div>

                <div className="hidden overflow-hidden rounded-lg border border-slate-200 md:block">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-bold">Avaliador</th>
                                <th className="hidden px-4 py-3 font-bold md:table-cell">E-mail</th>
                                <th className="px-4 py-3 text-center font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {carregando && (
                                <tr><td className="px-4 py-5 text-sm font-semibold text-slate-500" colSpan={3}>Carregando avaliadores...</td></tr>
                            )}
                            {!carregando && avaliadores.map((avaliador) => (
                                <tr key={avaliador.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onSelecionar(avaliador)}>
                                    <td className="px-4 py-3.5">
                                        <p className="font-bold text-slate-900">{avaliador.nome}</p>
                                        <p className="mt-1 text-xs text-slate-500">CPF {formatarCpf(avaliador.cpf)}</p>
                                        <p className="mt-1 truncate text-xs text-slate-500 md:hidden">{avaliador.email}</p>
                                    </td>
                                    <td className="hidden max-w-[260px] px-4 py-3.5 md:table-cell">
                                        <p className="truncate text-slate-600" title={avaliador.email}>{avaliador.email}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-center"><StatusBadge status={avaliador.status} /></td>
                                </tr>
                            ))}
                            {!carregando && avaliadores.length === 0 && (
                                <tr><td className="px-4 py-5 text-sm font-semibold text-slate-500" colSpan={3}>Nenhum avaliador encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <aside className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {avaliadorSelecionado ? (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase text-slate-500">Detalhe do avaliador</p>
                                    <h2 className="mt-1 truncate text-xl font-extrabold text-blue-950">{avaliadorSelecionado.nome}</h2>
                                    <p className="mt-1 truncate text-sm text-slate-500" title={avaliadorSelecionado.email}>{avaliadorSelecionado.email}</p>
                                </div>
                                <StatusBadge status={avaliadorSelecionado.status} />
                            </div>

                            <div className="mt-4 grid gap-3">
                                <Info label="CPF" value={formatarCpf(avaliadorSelecionado.cpf)} />
                                <Info label="Região" value={avaliadorSelecionado.regioes} />
                                <Info label="Avaliações" value={String(avaliadorSelecionado.avaliacoes)} />
                                <Info label="Origem" value={avaliadorSelecionado.demonstracao ? 'Demonstração' : 'Banco de dados'} />
                            </div>

                            <div className="mt-4 grid gap-2">
                                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-60" type="button" onClick={() => onGerarLink(avaliadorSelecionado)} disabled={gerandoLinkId === avaliadorSelecionado.id}>
                                    <Copy className="h-4 w-4" />
                                    Gerar e copiar link
                                </button>
                                <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold ${avaliadorSelecionado.status === 'Ativo' ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-blue-700 text-white hover:bg-blue-800'}`} type="button" onClick={() => onAlternarStatus(avaliadorSelecionado)}>
                                    {avaliadorSelecionado.status === 'Ativo' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                    {avaliadorSelecionado.status === 'Ativo' ? 'Desativar avaliador' : 'Ativar avaliador'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm font-semibold text-slate-500">Selecione um avaliador para ver os detalhes.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}

function MenuItem({ texto, icone, ativo, onClick }) {
    return (
        <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${ativo ? 'bg-blue-700 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
            <span className="[&_svg]:h-4 [&_svg]:w-4">{icone}</span>
            {texto}
        </button>
    );
}

function Tab({ texto, ativo, onClick }) {
    return (
        <button type="button" onClick={onClick} className={`h-9 shrink-0 rounded-md px-3 text-xs font-bold ${ativo ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
            {texto}
        </button>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900" title={value}>{value}</p>
        </div>
    );
}

function Permissao({ texto, ativo }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-sm font-medium text-slate-700">{texto}</span>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {ativo ? 'Permitido' : 'Bloqueado'}
            </span>
        </div>
    );
}

function StatusBadge({ status }) {
    const ativo = status === 'Ativo';
    const pendente = status === 'Pendente';
    const Icone = ativo ? UserCheck : pendente ? CircleDashed : UserX;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${ativo ? 'bg-emerald-50 text-emerald-700' : pendente ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
            <Icone className="h-4 w-4 shrink-0" strokeWidth={2.4} />
            {status}
        </span>
    );
}

function formatarCpf(cpf) {
    const valor = String(cpf || '').replace(/\D/g, '').padStart(11, '0').slice(0, 11);
    return `${valor.slice(0, 3)}.${valor.slice(3, 6)}.${valor.slice(6, 9)}-${valor.slice(9, 11)}`;
}

function normalizar(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

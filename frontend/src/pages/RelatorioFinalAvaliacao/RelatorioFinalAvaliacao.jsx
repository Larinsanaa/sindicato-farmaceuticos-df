import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, Send, Star, TriangleAlert, X } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch } from '../../lib/api.js';
import { carregarRelatorioFinal } from '../../lib/relatorioFinal.js';

export default function RelatorioFinalAvaliacao() {
    const navigate = useNavigate();
    const relatorio = useMemo(() => carregarRelatorioFinal(), []);
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [avisoEmail, setAvisoEmail] = useState({ texto: '', tipo: '' });

    // Sem relatório salvo (ex.: acesso direto pela URL) volta pro dashboard.
    if (!relatorio) {
        return <Navigate to="/dashboard" replace />;
    }

    const corMedidor = corPorMedia(relatorio.mediaGeral);
    const destaques = gerarDestaques(relatorio);

    function fecharRelatorio() {
        navigate('/dashboard');
    }

    async function enviarPorEmail() {
        const idSalvo = String(relatorio.id || '');

        if (!idSalvo || idSalvo.startsWith('rel-')) {
            setAvisoEmail({ texto: 'Esta avaliação ainda não foi salva no sistema — não é possível enviar por e-mail.', tipo: 'erro' });
            return;
        }

        setEnviandoEmail(true);
        setAvisoEmail({ texto: '', tipo: '' });

        try {
            const resposta = await apiFetch(`/api/avaliacoes/${idSalvo}/enviar-email`, { method: 'POST' });
            setAvisoEmail({ texto: resposta?.message || 'Relatório enviado por e-mail.', tipo: 'sucesso' });
        } catch (error) {
            setAvisoEmail({ texto: error.message || 'Não foi possível enviar o e-mail.', tipo: 'erro' });
        } finally {
            setEnviandoEmail(false);
        }
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />

            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
                <button
                    className="mb-4 flex items-center gap-2 rounded-md px-1 py-2 text-sm font-bold text-blue-900"
                    type="button"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Dashboard
                </button>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase text-blue-900/70 sm:text-sm">Resumo final</p>
                            <h1 className="mt-2 text-xl font-extrabold text-blue-950 sm:text-2xl">Relatório resumido para visualização</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-extrabold text-blue-700 hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                                type="button"
                                onClick={enviarPorEmail}
                                disabled={enviandoEmail}
                            >
                                {enviandoEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {enviandoEmail ? 'Enviando...' : 'Enviar por e-mail'}
                            </button>
                            <button
                                className="flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-extrabold text-white hover:bg-blue-800"
                                type="button"
                                onClick={fecharRelatorio}
                            >
                                <X className="h-4 w-4" />
                                Fechar
                            </button>
                        </div>
                    </div>

                    {avisoEmail.texto && (
                        <div className={`mt-3 rounded-lg border p-3 text-sm font-semibold ${avisoEmail.tipo === 'sucesso' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                            {avisoEmail.texto}
                        </div>
                    )}

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-stretch">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                            <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-blue-950 sm:text-3xl">{relatorio.farmacia}</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">CNPJ {relatorio.cnpj}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{relatorio.endereco}</p>
                                    <p className="mt-2 text-xs font-semibold text-slate-500">Avaliado em {formatarDataHora(relatorio.criadoEm)}</p>
                                </div>

                                <MedidorCircular media={relatorio.mediaGeral} texto={relatorio.mediaGeralTexto} cor={corMedidor} />
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Classificação</p>
                                    <p className="mt-1 text-base font-extrabold text-blue-950">{relatorio.classificacao}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Resultado consolidado da avaliação.</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Seções avaliadas</p>
                                    <p className="mt-1 text-base font-extrabold text-blue-950">{relatorio.secoes.length}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Quantidade de blocos concluídos no relatório.</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Pontos críticos</p>
                                    <p className="mt-1 text-base font-extrabold text-blue-950">{relatorio.problemas.length}</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Itens marcados para revisão e atenção.</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white/70 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Síntese rápida</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{relatorio.resumo}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-extrabold text-blue-950">Resumo da avaliação</h2>
                                    <p className="mt-1 text-sm text-slate-500">{relatorio.classificacao}</p>
                                </div>
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-blue-950">
                                    {relatorio.mediaGeralTexto}
                                </span>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-600">{relatorio.resumo}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">Data e hora da avaliação: {formatarDataHora(relatorio.criadoEm)}</p>

                            <div className="mt-5 grid gap-2">
                                {relatorio.secoes.map((secao) => (
                                    <div key={secao.titulo} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                        <span className="text-sm font-semibold text-slate-700">{secao.titulo}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-0.5 text-amber-400">
                                                {[1, 2, 3, 4, 5].map((item) => (
                                                    <Star key={item} className={`h-3.5 w-3.5 ${Number(secao.media) >= item ? 'fill-amber-400' : 'text-slate-300'}`} />
                                                ))}
                                            </span>
                                            <span className="text-sm font-extrabold text-blue-950">{secao.mediaTexto}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                        <ClipboardList className="h-5 w-5 text-blue-700" />
                        <h2 className="text-base font-extrabold text-slate-900">Pontos em destaque</h2>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {destaques.map((destaque) => (
                            <article key={`${destaque.titulo}-${destaque.descricao}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${destaque.classeFundo}`}>
                                        <destaque.icone className={`h-4 w-4 ${destaque.classeTexto}`} />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900">{destaque.titulo}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">{destaque.descricao}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                            <TriangleAlert className="h-5 w-5 text-amber-500" />
                            <h2 className="text-base font-extrabold text-slate-900">Problemas identificados</h2>
                        </div>

                        <div className="mt-4 space-y-3">
                            {relatorio.problemas.map((problema) => (
                                <article key={problema.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-900">{problema.titulo}</h3>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">{problema.detalhe}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-base font-extrabold text-slate-900">Conferência</h2>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                                <span>Classificação</span>
                                <span className="font-bold text-slate-900">{relatorio.classificacao}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Média geral</span>
                                <span className="font-bold text-slate-900">{relatorio.mediaGeralTexto}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Seções avaliadas</span>
                                <span className="font-bold text-slate-900">{relatorio.secoes.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Data e hora</span>
                                <span className="font-bold text-slate-900">{formatarDataHora(relatorio.criadoEm)}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

function MedidorCircular({ media, texto, cor }) {
    const tamanho = 96;
    const stroke = 8;
    const radio = (tamanho - stroke) / 2;
    const circunferencia = 2 * Math.PI * radio;
    const progresso = Math.max(0, Math.min(1, (Number(media) || 0) / 5));
    const dashOffset = circunferencia * (1 - progresso);

    return (
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <svg viewBox={`0 0 ${tamanho} ${tamanho}`} className="h-full w-full -rotate-90">
                <circle
                    cx={tamanho / 2}
                    cy={tamanho / 2}
                    r={radio}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    className="text-slate-200"
                />
                <circle
                    cx={tamanho / 2}
                    cy={tamanho / 2}
                    r={radio}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={dashOffset}
                    className={cor.stroke}
                />
            </svg>
            <div className="absolute text-center">
                <div className={`text-3xl font-extrabold ${cor.text}`}>{texto}</div>
            </div>
        </div>
    );
}

function corPorMedia(media) {
    const nota = Number(media) || 0;

    if (nota >= 4.5) {
        return { stroke: 'text-emerald-500', text: 'text-emerald-700' };
    }

    if (nota >= 3.5) {
        return { stroke: 'text-blue-500', text: 'text-blue-900' };
    }

    if (nota >= 2.5) {
        return { stroke: 'text-amber-500', text: 'text-amber-700' };
    }

    return { stroke: 'text-rose-500', text: 'text-rose-700' };
}

function gerarDestaques(relatorio) {
    const destaques = [];
    const secoesOrdenadas = [...(relatorio.secoes || [])].sort((a, b) => Number(b.media) - Number(a.media));
    const melhoresSecoes = secoesOrdenadas.filter((secao) => Number(secao.media) >= 4).slice(0, 2);
    const pontosAtencao = secoesOrdenadas.filter((secao) => Number(secao.media) < 3.5).slice(0, 2);
    const problemas = (relatorio.problemas || []).slice(0, 2);

    if (relatorio.classificacao === 'Ótimo') {
        destaques.push({
            titulo: 'Desempenho acima da média',
            descricao: 'A unidade entregou uma avaliação muito consistente nas seções principais.',
            icone: CheckCircle2,
            classeFundo: 'bg-emerald-100',
            classeTexto: 'text-emerald-700'
        });
    } else if (relatorio.classificacao === 'Bom') {
        destaques.push({
            titulo: 'Base operacional positiva',
            descricao: 'O resultado geral é bom e mantém um padrão aceitável para continuidade.',
            icone: CheckCircle2,
            classeFundo: 'bg-blue-100',
            classeTexto: 'text-blue-700'
        });
    } else if (relatorio.classificacao === 'Regular') {
        destaques.push({
            titulo: 'Necessita ajustes pontuais',
            descricao: 'O conjunto está funcional, mas há pontos específicos que precisam de reforço.',
            icone: TriangleAlert,
            classeFundo: 'bg-amber-100',
            classeTexto: 'text-amber-700'
        });
    } else {
        destaques.push({
            titulo: 'Atenção prioritária',
            descricao: 'A avaliação mostra falhas que precisam de correção antes de uma nova conferência.',
            icone: TriangleAlert,
            classeFundo: 'bg-rose-100',
            classeTexto: 'text-rose-700'
        });
    }

    melhoresSecoes.forEach((secao) => {
        destaques.push({
            titulo: `${secao.titulo} em bom nível`,
            descricao: `Média de ${secao.mediaTexto}, acima do padrão mínimo esperado.`,
            icone: Star,
            classeFundo: 'bg-sky-100',
            classeTexto: 'text-sky-700'
        });
    });

    pontosAtencao.forEach((secao) => {
        destaques.push({
            titulo: `${secao.titulo} pede revisão`,
            descricao: `Média de ${secao.mediaTexto}, abaixo do ideal para fechamento da avaliação.`,
            icone: TriangleAlert,
            classeFundo: 'bg-amber-100',
            classeTexto: 'text-amber-700'
        });
    });

    problemas.forEach((problema) => {
        destaques.push({
            titulo: problema.titulo,
            descricao: problema.detalhe,
            icone: ClipboardList,
            classeFundo: 'bg-slate-200',
            classeTexto: 'text-slate-700'
        });
    });

    return destaques.slice(0, 4);
}

function formatarDataHora(valor) {
    if (!valor) {
        return 'Data não informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return 'Data não informada';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(data);
}

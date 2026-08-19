import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, Eye, Loader2, Send, Star, TriangleAlert, X } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch } from '../../lib/api.js';
import { carregarRelatorioFinal, criarRelatorioExemplo } from '../../lib/relatorioFinal.js';

export default function RelatorioFinalAvaliacao() {
    const navigate = useNavigate();
    const relatorio = useMemo(() => carregarRelatorioFinal() || criarRelatorioExemplo(), []);
    const corMedidor = corPorMedia(relatorio.mediaGeral);
    const destaques = useMemo(() => gerarDestaques(relatorio), [relatorio]);
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [avisoEmail, setAvisoEmail] = useState({ texto: '', tipo: '' });

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

    function exportarPdf() {
        const janela = window.open('', '_blank', 'width=1200,height=900');

        if (!janela) {
            alert('Não foi possível abrir a janela de exportação.');
            return;
        }

        const html = montarHtmlPdf(relatorio, destaques);
        janela.document.open();
        janela.document.write(html);
        janela.document.close();
        janela.focus();

        janela.onload = () => {
            janela.print();
        };

        janela.onafterprint = () => {
            janela.close();
        };
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
                                className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-extrabold text-blue-700 hover:border-sky-300"
                                type="button"
                                onClick={exportarPdf}
                            >
                                <Eye className="h-4 w-4" />
                                Visualizar relatório
                            </button>
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

function montarHtmlPdf(relatorio, destaques) {
    const data = formatarDataHora(relatorio.criadoEm);
    const secoes = (relatorio.secoes || [])
        .map((secao) => {
            const percentual = percentualPorMedia(secao.media);

            return `
            <tr>
                <td><strong>${escapeHtml(secao.titulo)}</strong></td>
                <td class="score">${escapeHtml(secao.mediaTexto)}</td>
                <td>
                    <div class="progress" aria-hidden="true">
                        <span style="width:${percentual}%"></span>
                    </div>
                </td>
                <td>${escapeHtml(secao.observacao || 'Sem observação registrada')}</td>
            </tr>
        `;
        })
        .join('');

    const problemas = (relatorio.problemas || [])
        .map((problema) => `
            <li class="problem">
                <strong>${escapeHtml(problema.titulo)}</strong>
                <span>${escapeHtml(problema.detalhe)}</span>
            </li>
        `)
        .join('');

    const destaquesHtml = destaques
        .map((destaque) => `
            <li class="highlight">
                <strong>${escapeHtml(destaque.titulo)}</strong>
                <span>${escapeHtml(destaque.descricao)}</span>
            </li>
        `)
        .join('');

    // Questionário completo: cada item avaliado com a nota em estrelas,
    // agrupado por seção — pedido do cliente pra não ficar resumido.
    const questionario = (relatorio.secoes || [])
        .map((secao) => {
            const itens = (secao.perguntas || [])
                .map((item) => {
                    const nota = Math.max(0, Math.min(5, Number(item.nota) || 0));

                    return `
                    <div class="quest-item">
                        <span class="quest-nome">${escapeHtml(item.pergunta)}</span>
                        <span class="quest-nota">
                            <span class="estrelas" aria-hidden="true"><span class="cheias">${'★'.repeat(nota)}</span><span class="vazias">${'★'.repeat(5 - nota)}</span></span>
                            <span class="quest-valor" style="color:${corPorNotaPdf(nota)};">${nota}</span>
                        </span>
                    </div>
                `;
                })
                .join('');

            if (!itens) return '';

            return `
            <div class="quest-card">
                <div class="quest-head">
                    <span class="quest-secao">${escapeHtml(secao.titulo)}</span>
                    <span class="quest-media" style="background:${corPorNotaPdf(secao.media)}1a;color:${corPorNotaPdf(secao.media)};">média ${escapeHtml(secao.mediaTexto)}</span>
                </div>
                ${itens}
            </div>
        `;
        })
        .join('');

    return `
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatório de Avaliação</title>
    <style>
        @page {
            size: A4;
            margin: 18mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Inter, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.55;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }

        .page {
            max-width: 100%;
        }

        .topbar {
            height: 7px;
            margin-bottom: 18px;
            background: linear-gradient(90deg, #082f68 0%, #1d4ed8 58%, #b08d18 100%);
            border-radius: 999px;
        }

        .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 150px;
            gap: 22px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 18px;
            margin-bottom: 18px;
        }

        .brand {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: #1d4ed8;
        }

        h1 {
            margin: 6px 0 6px;
            color: #071d49;
            font-size: 25px;
            line-height: 1.2;
        }

        .meta {
            color: #475569;
            margin: 0;
        }

        .badge {
            align-self: start;
            border: 1px solid #bfdbfe;
            border-radius: 14px;
            padding: 15px 12px;
            min-width: 140px;
            background: #eff6ff;
            text-align: center;
        }

        .badge span {
            display: block;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
        }

        .badge strong {
            display: block;
            margin: 8px 0;
            font-size: 34px;
            line-height: 1;
            color: #1d4ed8;
        }

        .grid {
            display: grid;
            grid-template-columns: 1.2fr .8fr;
            gap: 16px;
            margin-bottom: 16px;
        }

        .card {
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            padding: 16px;
            background: #ffffff;
            break-inside: avoid;
        }

        .card h2 {
            margin: 0 0 10px;
            font-size: 14px;
            color: #0f172a;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 14px;
        }

        .summary .item {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            background: #f8fafc;
        }

        .summary .label {
            display: block;
            margin-bottom: 4px;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .summary .value {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
        }

        .highlights {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .highlight {
            border: 1px solid #e2e8f0;
            border-left: 4px solid #3b82f6;
            border-radius: 12px;
            padding: 12px;
            background: #fff;
        }

        .highlight strong {
            display: block;
            margin-bottom: 4px;
            font-size: 12px;
        }

        .highlight span,
        .problem span {
            color: #475569;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        th,
        td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            text-align: left;
            vertical-align: middle;
        }

        th {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
        }

        .score {
            width: 62px;
            color: #071d49;
            font-weight: 800;
            text-align: right;
            white-space: nowrap;
        }

        .progress {
            width: 100%;
            min-width: 90px;
            height: 9px;
            overflow: hidden;
            border-radius: 999px;
            background: #dbeafe;
        }

        .progress span {
            display: block;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #2563eb, #60a5fa);
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .problem,
        .footer-note {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            background: #f8fafc;
        }

        .problem + .problem {
            margin-top: 10px;
        }

        .problem strong {
            display: block;
            margin-bottom: 4px;
        }

        .footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            gap: 16px;
            color: #64748b;
            font-size: 10px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }

        .assinaturas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            margin-top: 28px;
        }

        .assinatura {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            color: #64748b;
            font-size: 10px;
            text-align: center;
        }

        .quest-legenda {
            margin: -4px 0 10px;
            color: #64748b;
            font-size: 11px;
        }

        .quest-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .quest-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 14px;
            background: #f8fafc;
            break-inside: avoid;
        }

        .quest-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 4px;
        }

        .quest-secao {
            color: #071d49;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .quest-media {
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
        }

        .quest-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 7px 0;
            border-bottom: 1px dashed #e2e8f0;
        }

        .quest-item:last-child {
            border-bottom: none;
            padding-bottom: 2px;
        }

        .quest-nome {
            color: #0f172a;
            font-size: 12px;
        }

        .quest-nota {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .estrelas {
            font-size: 13px;
            letter-spacing: 2px;
        }

        .estrelas .cheias { color: #f59e0b; }
        .estrelas .vazias { color: #cbd5e1; }

        .quest-valor {
            min-width: 14px;
            font-size: 12px;
            font-weight: 800;
            text-align: right;
        }

        @media print {
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="topbar"></div>
        <div class="header">
            <div>
                <div class="brand">Sincofarma-DF</div>
                <h1>Relatório Final de Avaliação</h1>
                <p class="meta">${escapeHtml(relatorio.farmacia)} • CNPJ ${escapeHtml(relatorio.cnpj)}</p>
                <p class="meta">${escapeHtml(relatorio.endereco)}</p>
                <p class="meta">Avaliado em ${escapeHtml(data)}</p>
            </div>
            <div class="badge">
                <span>Nota geral</span>
                <strong>${escapeHtml(relatorio.mediaGeralTexto)}</strong>
                <span>${escapeHtml(relatorio.classificacao)}</span>
            </div>
        </div>

        <div class="grid">
            <section class="card">
                <h2>Resumo executivo</h2>
                <p>${escapeHtml(relatorio.resumo)}</p>
                <div class="summary">
                    <div class="item">
                        <span class="label">Média geral</span>
                        <span class="value">${escapeHtml(relatorio.mediaGeralTexto)}</span>
                    </div>
                    <div class="item">
                        <span class="label">Classificação</span>
                        <span class="value">${escapeHtml(relatorio.classificacao)}</span>
                    </div>
                    <div class="item">
                        <span class="label">Seções</span>
                        <span class="value">${relatorio.secoes.length}</span>
                    </div>
                </div>
            </section>

            <section class="card">
                <h2>Pontos em destaque</h2>
                <ul>
                    ${destaquesHtml}
                </ul>
            </section>
        </div>

        <section class="card">
            <h2>Detalhamento por seção</h2>
            <table>
                <thead>
                    <tr>
                        <th>Seção</th>
                        <th>Média</th>
                        <th>Indicador</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
                    ${secoes}
                </tbody>
            </table>
        </section>

        ${questionario ? `
        <section class="card" style="margin-top:16px;">
            <h2>Questionário completo</h2>
            <p class="quest-legenda">Cada item foi avaliado de 1 a 5 estrelas pelo avaliador.</p>
            <div class="quest-grid">
                ${questionario}
            </div>
        </section>` : ''}

        <div class="grid" style="margin-top:16px; grid-template-columns: 1fr 1fr;">
            <section class="card">
                <h2>Problemas identificados</h2>
                <ul>
                    ${problemas || '<li class="problem"><strong>Nenhum problema crítico identificado</strong><span>As seções avaliadas não registraram alertas relevantes.</span></li>'}
                </ul>
            </section>

            <section class="card">
                <h2>Conclusão</h2>
                <div class="footer-note">
                    O conteúdo impresso nesta versão foi preparado para arquivo e acompanhamento interno. A versão da tela permanece mais visual e resumida.
                </div>
            </section>
        </div>

        <div class="assinaturas">
            <div class="assinatura">Responsável pela avaliação</div>
            <div class="assinatura">Conferência administrativa</div>
        </div>

        <div class="footer">
            <div>Relatório gerado automaticamente pelo Sistema do Sincofarma-DF.</div>
            <div>${escapeHtml(data)}</div>
        </div>
    </div>
</body>
</html>
`;
}

function escapeHtml(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
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

// Cor de destaque conforme a nota: vermelho (crítico), âmbar (atenção), verde (bom).
function corPorNotaPdf(nota) {
    const numero = Number(nota) || 0;
    if (numero <= 2) return '#dc2626';
    if (numero < 4) return '#d97706';
    return '#16a34a';
}

function percentualPorMedia(media) {
    const nota = Number(media) || 0;
    return Math.max(0, Math.min(100, (nota / 5) * 100));
}








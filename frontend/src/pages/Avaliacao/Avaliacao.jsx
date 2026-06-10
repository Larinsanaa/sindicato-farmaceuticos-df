import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, CreditCard, Package, Star, Store, UserSquare2, Users } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { criarRelatorioFinal, formatarNota, salvarRelatorioFinal } from '../../lib/relatorioFinal.js';

export default function Avaliacao() {
    const navigate = useNavigate();
    const secoes = useMemo(() => [
        { titulo: 'Letreiro', icone: Store, perguntas: ['Apresentação', 'Manutenção', 'Iluminação'] },
        { titulo: 'Loja', icone: Building2, perguntas: ['Limpeza', 'Iluminação', 'Layout', 'Comunicação visual'] },
        { titulo: 'Gôndola', icone: Package, perguntas: ['Limpeza', 'Precificação', 'Rupturas'] },
        { titulo: 'Balcão', icone: Users, perguntas: ['Apresentação', 'Atenção', 'Conhecimento'] },
        { titulo: 'Salão', icone: UserSquare2, perguntas: ['Apresentação', 'Atenção', 'Conhecimento'] },
        { titulo: 'Caixa', icone: CreditCard, perguntas: ['Apresentação', 'Atenção', 'Conhecimento'] }
    ], []);

    const emojis = useMemo(() => [
        { emoji: '😁', texto: 'Ótimo', valor: 1, cor: 'bg-emerald-100 border-emerald-500 text-emerald-700' },
        { emoji: '😐', texto: 'Regular', valor: 2, cor: 'bg-amber-100 border-amber-500 text-amber-700' },
        { emoji: '😡', texto: 'Ruim', valor: 3, cor: 'bg-rose-100 border-rose-500 text-rose-700' }
    ], []);

    const [secaoAtual, setSecaoAtual] = useState(0);
    const [respostas, setRespostas] = useState({});
    const [notasSecao, setNotasSecao] = useState({});
    const [observacoesSecoes, setObservacoesSecoes] = useState({});

    function avaliarPergunta(secaoIndex, perguntaIndex, valor) {
        const chave = `${secaoIndex}-${perguntaIndex}`;
        setRespostas((prev) => ({ ...prev, [chave]: valor }));
    }

    function avaliarSecao(secaoIndex, valor) {
        const nota = Math.max(1, Math.min(5, Number(valor)));
        setNotasSecao((prev) => ({ ...prev, [secaoIndex]: nota }));
    }

    function alterarObservacao(secaoIndex, valor) {
        setObservacoesSecoes((prev) => ({ ...prev, [secaoIndex]: valor }));
    }

    function secaoCompleta(secaoIndex) {
        const perguntasRespondidas = secoes[secaoIndex].perguntas.every((_, perguntaIndex) => respostas[`${secaoIndex}-${perguntaIndex}`]);
        return Boolean(perguntasRespondidas && notasSecao[secaoIndex]);
    }

    function mediaSecao(secaoIndex) {
        return Number(notasSecao[secaoIndex] || 0);
    }

    function mediaGeral() {
        const notas = secoes.map((_, index) => Number(notasSecao[index] || 0)).filter((nota) => nota > 0);

        if (notas.length === 0) return 0;
        return Number((notas.reduce((soma, nota) => soma + nota, 0) / notas.length).toFixed(1));
    }

    function trocarSecao(index) {
        if (index > secaoAtual && !secaoCompleta(secaoAtual)) {
            alert('Responda todas as perguntas e selecione a nota em estrelas desta seção antes de continuar.');
            return;
        }

        setSecaoAtual(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function finalizarAvaliacao() {
        const todasRespondidas = secoes.every((_, index) => secaoCompleta(index));
        if (!todasRespondidas) {
            alert('Responda todas as perguntas e selecione as notas em estrelas antes de finalizar.');
            return;
        }

        const relatorio = criarRelatorioFinal({
            secoes,
            respostas,
            notasSecao,
            observacoesSecoes,
            farmacia: {
                nome: 'Mais Farma',
                cnpj: '05.123.456/0001-89',
                endereco: 'R. das Farmácias, 123, Centro, Cidade'
            }
        });

        salvarRelatorioFinal(relatorio);
        navigate('/relatorio-final-avaliacao');
    }

    const totalPerguntas = secoes.reduce((total, secao) => total + secao.perguntas.length, 0);
    const perguntasRespondidas = Object.keys(respostas).length;
    const mediaAtual = mediaSecao(secaoAtual);

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />

            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <p className="text-xs font-bold uppercase text-blue-900/70 sm:text-sm">Avaliação</p>
                    <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <h1 className="text-2xl font-extrabold leading-tight text-blue-950 sm:text-3xl">Auditoria da unidade</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                Avalie cada seção com emojis e defina a nota final da seção em estrelas no bloco inferior.
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:min-w-[340px]">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <InfoCard titulo="Seção" valor={`${secaoAtual + 1}/${secoes.length}`} />
                                <InfoCard titulo="Respostas" valor={`${perguntasRespondidas}/${totalPerguntas}`} />
                                <InfoCard titulo="Média" valor={mediaGeral() ? formatarNota(mediaGeral()) : '0,0'} destaque />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-700 transition-all" style={{ width: `${(Object.keys(notasSecao).length / secoes.length) * 100}%` }} />
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                            <h2 className="text-sm font-extrabold uppercase text-slate-900">Seções</h2>
                            <p className="mt-1 text-xs text-slate-500">Deslize para ver todas no celular.</p>
                        </div>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{secaoAtual + 1}/{secoes.length}</span>
                    </div>

                    <div className="mt-3 -mx-3 overflow-x-auto px-3 pb-1">
                        <div className="flex min-w-max gap-3 lg:grid lg:min-w-0 lg:grid-cols-6">
                            {secoes.map((secao, index) => {
                                const Icone = secao.icone;
                                const respondida = secaoCompleta(index);
                                const ativa = secaoAtual === index;
                                const media = mediaSecao(index);

                                return (
                                    <button
                                        key={secao.titulo}
                                        type="button"
                                        onClick={() => trocarSecao(index)}
                                        className={`flex w-[150px] shrink-0 items-center gap-3 rounded-md border p-3 text-left transition lg:w-full ${
                                            ativa
                                                ? 'border-blue-200 bg-blue-50'
                                                : respondida
                                                    ? 'border-emerald-200 bg-emerald-50'
                                                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${ativa ? 'bg-blue-700 text-white' : respondida ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                            <Icone className="h-5 w-5" />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold text-slate-900">{secao.titulo}</span>
                                            <span className="block text-xs text-slate-500">{secao.perguntas.length} itens</span>
                                            <span className="mt-1 block text-xs font-semibold text-slate-600">
                                                {media ? `Média ${formatarNota(media)}` : 'Sem média'}
                                            </span>
                                        </span>

                                        {respondida && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
                    <aside className="space-y-4">
                        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-extrabold uppercase text-slate-900">Resumo rápido</h2>
                            <div className="mt-3 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-3">
                                    <span>Seção atual:</span>
                                    <span className="font-bold text-slate-900">{secoes[secaoAtual].titulo}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Média da seção:</span>
                                    <span className="font-bold text-slate-900">{mediaAtual ? formatarNota(mediaAtual) : '0,0'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Observação:</span>
                                    <span className="font-bold text-slate-900">{observacoesSecoes[secaoAtual]?.trim() ? 'preenchida' : 'opcional'}</span>
                                </div>
                            </div>
                        </section>
                    </aside>

                    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
                            <p className="text-xs font-bold uppercase text-blue-900/70">Seção {secaoAtual + 1}</p>
                            <h2 className="mt-1 text-xl font-extrabold text-blue-950">{secoes[secaoAtual].titulo}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">Marque cada item com emojis e defina a nota final da seção em estrelas no bloco inferior.</p>
                        </div>

                        <div className="space-y-4 p-4 sm:p-6">
                            {secoes[secaoAtual].perguntas.map((pergunta, perguntaIndex) => {
                                const chave = `${secaoAtual}-${perguntaIndex}`;
                                const respostaAtual = Number(respostas[chave] || 0);

                                return (
                                    <article key={pergunta} className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-slate-500">Pergunta {perguntaIndex + 1}</p>
                                                <h3 className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">{pergunta}</h3>
                                            </div>
                                            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{respostaAtual ? emojis.find((item) => item.valor === respostaAtual)?.texto : 'Pendente'}</span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            {emojis.map((item) => {
                                                const selecionada = respostaAtual === item.valor;

                                                return (
                                                    <button
                                                        key={item.texto}
                                                        type="button"
                                                        onClick={() => avaliarPergunta(secaoAtual, perguntaIndex, item.valor)}
                                                        className={`flex items-center gap-3 rounded-md border p-3 text-left transition hover:-translate-y-0.5 ${selecionada ? item.cor : 'border-slate-200 bg-white hover:border-sky-300'}`}
                                                    >
                                                        <span className="text-3xl leading-none">{item.emoji}</span>
                                                        <span className={`text-sm font-bold ${selecionada ? 'text-inherit' : 'text-slate-700'}`}>{item.texto}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </article>
                                );
                            })}

                            <article className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">Avaliação por estrelas da seção</p>
                                        <p className="mt-1 text-xs text-slate-500">Essa nota define a média da seção e entra no relatório final.</p>
                                    </div>
                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                        {mediaAtual ? `${formatarNota(mediaAtual)}/5` : '0,0/5'}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((valor) => {
                                        const selecionada = mediaAtual >= valor;

                                        return (
                                            <button
                                                key={valor}
                                                type="button"
                                                onClick={() => avaliarSecao(secaoAtual, valor)}
                                                className={`flex h-11 w-11 items-center justify-center rounded-md border transition ${selecionada ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300 hover:border-sky-300 hover:text-amber-300'}`}
                                                aria-label={`${valor} estrela${valor > 1 ? 's' : ''}`}
                                            >
                                                <Star className={`h-5 w-5 ${selecionada ? 'fill-amber-400' : ''}`} />
                                            </button>
                                        );
                                    })}
                                    <span className="flex items-center self-center text-sm font-semibold text-slate-500">
                                        {mediaAtual ? `Nota ${formatarNota(mediaAtual)}` : 'Selecione a nota'}
                                    </span>
                                </div>
                            </article>

                            <article className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-700">Observação da seção <span className="font-medium text-slate-400">(opcional)</span></span>
                                    <textarea
                                        className="min-h-28 w-full rounded-md border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                        placeholder="Deixe aqui uma observação geral sobre esta seção, se necessário..."
                                        value={observacoesSecoes[secaoAtual] || ''}
                                        onChange={(evento) => alterarObservacao(secaoAtual, evento.target.value)}
                                    />
                                </label>
                            </article>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
                                <button type="button" onClick={() => setSecaoAtual((atual) => Math.max(0, atual - 1))} disabled={secaoAtual === 0} className="h-12 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1">
                                    Voltar
                                </button>

                                {secaoAtual < secoes.length - 1 ? (
                                    <button type="button" onClick={() => trocarSecao(secaoAtual + 1)} className="h-12 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 sm:flex-1">
                                        Próxima seção
                                    </button>
                                ) : (
                                    <button type="button" onClick={finalizarAvaliacao} className="h-12 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 sm:flex-1">
                                        Finalizar avaliação
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

function InfoCard({ titulo, valor, destaque = false }) {
    return (
        <div className={`rounded-md border border-slate-200 bg-slate-50 p-3 text-center ${destaque ? 'shadow-none' : 'shadow-sm'}`}>
            <p className="text-xs font-semibold uppercase text-slate-500">{titulo}</p>
            <p className="mt-1 text-lg font-extrabold text-blue-950">{valor}</p>
        </div>
    );
}

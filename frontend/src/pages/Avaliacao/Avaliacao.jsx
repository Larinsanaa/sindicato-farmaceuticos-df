import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, CreditCard, Package, Star, Store, UserSquare2, Users } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch } from '../../lib/api.js';
import { carregarFarmaciaSelecionada } from '../../lib/farmaciaSelecionada.js';
import { calcularNotaSecao, criarRelatorioFinal, formatarNota, salvarRelatorioFinal } from '../../lib/relatorioFinal.js';

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

    const [secaoAtual, setSecaoAtual] = useState(0);
    const [respostas, setRespostas] = useState({});
    const [observacoesSecoes, setObservacoesSecoes] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState('');
    const farmaciaSelecionada = useMemo(() => carregarFarmaciaSelecionada(), []);

    function avaliarPergunta(secaoIndex, perguntaIndex, valor) {
        const chave = `${secaoIndex}-${perguntaIndex}`;
        setRespostas((prev) => ({ ...prev, [chave]: Math.max(1, Math.min(5, Number(valor))) }));
    }

    function alterarObservacao(secaoIndex, valor) {
        setObservacoesSecoes((prev) => ({ ...prev, [secaoIndex]: valor }));
    }

    function secaoCompleta(secaoIndex) {
        return secoes[secaoIndex].perguntas.every((_, perguntaIndex) => respostas[`${secaoIndex}-${perguntaIndex}`]);
    }

    function mediaSecao(secaoIndex) {
        const valores = secoes[secaoIndex].perguntas.map((_, perguntaIndex) => respostas[`${secaoIndex}-${perguntaIndex}`]);
        return calcularNotaSecao(valores);
    }

    function mediaGeral() {
        const notas = secoes.map((_, index) => mediaSecao(index)).filter((nota) => nota > 0);

        if (notas.length === 0) return 0;
        return Number((notas.reduce((soma, nota) => soma + nota, 0) / notas.length).toFixed(1));
    }

    function trocarSecao(index) {
        if (index > secaoAtual && !secaoCompleta(secaoAtual)) {
            alert('Avalie todos os itens desta seção com as estrelas antes de continuar.');
            return;
        }

        setSecaoAtual(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function finalizarAvaliacao() {
        const todasRespondidas = secoes.every((_, index) => secaoCompleta(index));
        if (!todasRespondidas) {
            alert('Avalie todos os itens de todas as seções antes de finalizar.');
            return;
        }

        if (!farmaciaSelecionada) {
            setErroSalvar('Busque e selecione uma farmácia antes de finalizar a avaliação.');
            return;
        }

        const relatorio = criarRelatorioFinal({
            secoes,
            respostas,
            observacoesSecoes,
            farmacia: farmaciaSelecionada
        });

        setSalvando(true);
        setErroSalvar('');

        try {
            const localizacao = obterLocalizacaoSalva(farmaciaSelecionada) || await obterLocalizacaoAtual();
            const resultado = await apiFetch('/api/avaliacoes', {
                method: 'POST',
                body: JSON.stringify(montarPayloadAvaliacao({
                    secoes,
                    respostas,
                    observacoesSecoes,
                    farmacia: farmaciaSelecionada,
                    relatorio,
                    localizacao
                }))
            });

            salvarRelatorioFinal({
                ...relatorio,
                id: resultado?.avaliacao?.id || relatorio.id,
                criadoEm: resultado?.avaliacao?.created_at || relatorio.criadoEm
            });
            navigate('/relatorio-final-avaliacao');
        } catch (error) {
            setErroSalvar(error.message || 'Não foi possível salvar a avaliação.');
        } finally {
            setSalvando(false);
        }
    }

    const totalPerguntas = secoes.reduce((total, secao) => total + secao.perguntas.length, 0);
    const perguntasRespondidas = Object.keys(respostas).length;
    const mediaAtual = mediaSecao(secaoAtual);
    const secoesCompletas = secoes.filter((_, index) => secaoCompleta(index)).length;

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
                                Avalie cada item de 1 a 5 estrelas. A nota da seção é a média dos itens.
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:min-w-[340px]">
                            <div className="grid grid-cols-3 gap-3">
                                <InfoCard titulo="Seção" valor={`${secaoAtual + 1}/${secoes.length}`} />
                                <InfoCard titulo="Respostas" valor={`${perguntasRespondidas}/${totalPerguntas}`} />
                                <InfoCard titulo="Média" valor={mediaGeral() ? formatarNota(mediaGeral()) : '0,0'} destaque />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-700 transition-all" style={{ width: `${(secoesCompletas / secoes.length) * 100}%` }} />
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
                                        className={`flex min-h-[104px] w-[160px] shrink-0 items-start gap-3 rounded-md border p-3 text-left transition lg:w-full ${
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

                                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="block truncate text-sm font-bold leading-5 text-slate-900">{secao.titulo}</span>
                                            <span className="block text-xs leading-4 text-slate-500">{secao.perguntas.length} itens</span>
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
                            <p className="mt-3 text-sm leading-6 text-slate-600">Marque cada item de 1 a 5 estrelas. A nota da seção é calculada pela média dos itens.</p>
                        </div>

                        <div className="space-y-4 p-4 sm:p-6">
                            {secoes[secaoAtual].perguntas.map((pergunta, perguntaIndex) => {
                                const chave = `${secaoAtual}-${perguntaIndex}`;
                                const respostaAtual = Number(respostas[chave] || 0);

                                return (
                                    <article key={pergunta} className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-slate-500">Item {perguntaIndex + 1}</p>
                                                <h3 className="mt-1 text-base font-extrabold text-slate-900 sm:text-lg">{pergunta}</h3>
                                            </div>
                                            <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">{respostaAtual ? `Nota ${respostaAtual}/5` : 'Pendente'}</span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((valor) => {
                                                const selecionada = respostaAtual >= valor;

                                                return (
                                                    <button
                                                        key={valor}
                                                        type="button"
                                                        onClick={() => avaliarPergunta(secaoAtual, perguntaIndex, valor)}
                                                        className={`flex h-11 w-11 items-center justify-center rounded-md border transition ${selecionada ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300 hover:border-sky-300 hover:text-amber-300'}`}
                                                        aria-label={`${valor} estrela${valor > 1 ? 's' : ''} para ${pergunta}`}
                                                    >
                                                        <Star className={`h-5 w-5 ${selecionada ? 'fill-amber-400' : ''}`} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </article>
                                );
                            })}

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
                                    <button type="button" onClick={finalizarAvaliacao} disabled={salvando} className="h-12 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-1">
                                        {salvando ? 'Salvando avaliação...' : 'Finalizar avaliação'}
                                    </button>
                                )}
                            </div>

                            {erroSalvar && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                                    {erroSalvar}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

function montarPayloadAvaliacao({ secoes, respostas, observacoesSecoes, farmacia, relatorio, localizacao }) {
    const respostasDetalhadas = secoes.flatMap((secao, secaoIndex) => (
        secao.perguntas.map((pergunta, perguntaIndex) => ({
            secao: secao.titulo,
            pergunta,
            valor: Number(respostas[`${secaoIndex}-${perguntaIndex}`])
        }))
    ));

    const observacoes = secoes
        .map((secao, index) => {
            const texto = String(observacoesSecoes[index] || '').trim();
            return texto ? `${secao.titulo}: ${texto}` : '';
        })
        .filter(Boolean)
        .join('\n');

    return {
        farmacia: farmacia.nome,
        cnpj: farmacia.cnpj,
        endereco: farmacia.endereco,
        cidade: farmacia.municipio || null,
        estado: farmacia.uf || null,
        observacao: observacoes || null,
        respostas: respostasDetalhadas,
        notaGeral: relatorio.mediaGeral,
        localizacao_ativa: true,
        latitude: localizacao.latitude,
        longitude: localizacao.longitude
    };
}

function obterLocalizacaoAtual() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Este navegador não permite obter a localização. A avaliação não foi salva.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (posicao) => {
                resolve({
                    latitude: posicao.coords.latitude,
                    longitude: posicao.coords.longitude
                });
            },
            () => {
                reject(new Error('Ative ou permita a localização para salvar a avaliação no histórico.'));
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 60000
            }
        );
    });
}

function obterLocalizacaoSalva(farmacia) {
    const latitude = Number(farmacia?.localizacao?.latitude);
    const longitude = Number(farmacia?.localizacao?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    return { latitude, longitude };
}

function InfoCard({ titulo, valor, destaque = false }) {
    return (
        <div className={`flex min-h-[76px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 p-3 text-center ${destaque ? 'shadow-none' : 'shadow-sm'}`}>
            <p className="text-[11px] font-bold uppercase leading-4 text-slate-500">{titulo}</p>
            <p className="mt-1 text-lg font-extrabold leading-6 text-blue-950">{valor}</p>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Send, Star } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch } from '../../lib/api.js';
import { normalizarDetalheAvaliacao } from '../../lib/avaliacoes.js';
import { exportarAvaliacaoPdf } from '../../lib/exportarRelatorio.js';

export default function RelatorioAvaliacao() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [avaliacao, setAvaliacao] = useState(null);
    const [erroExportar, setErroExportar] = useState('');


    function exportar() {
        try {
            setErroExportar('');
            exportarAvaliacaoPdf(avaliacao);
        } catch (error) {
            setErroExportar(error.message);
        }
    }

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            setCarregando(true);
            setErro('');

            try {
                const resposta = await apiFetch(`/api/avaliacoes/${id}`);
                const normalizada = normalizarDetalheAvaliacao(resposta);

                if (ativo) {
                    setAvaliacao(normalizada);
                }
            } catch (error) {
                if (ativo) {
                    setErro('Não foi possível carregar o relatório do backend. Verifique a API e a conexão.');
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
    }, [id]);

    if (carregando) {
        return (
            <main className="min-h-dvh bg-slate-50 text-slate-900">
                <Cabecalho textoBotao="Historico" onClick={() => navigate('/historico-avaliacoes')} />
                <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-6 text-sm font-semibold text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando relatório...
                </div>
            </main>
        );
    }

    if (!avaliacao) {
        return (
            <main className="min-h-dvh bg-slate-50 text-slate-900">
                <Cabecalho textoBotao="Dashboard" onClick={() => navigate('/dashboard')} />
                <div className="mx-auto max-w-md px-4 py-6">
                    <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">{erro || 'Relatório não encontrado.'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Historico" onClick={() => navigate('/historico-avaliacoes')} />

            <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4 pb-8 sm:max-w-2xl sm:px-6">
                <button className="flex w-fit items-center gap-2 rounded-md px-1 py-2 text-sm font-bold text-blue-900" type="button" onClick={() => navigate('/historico-avaliacoes')}>
                    <ArrowLeft className="h-4 w-4" />
                    Relatório {avaliacao.farmacia}
                </button>

                {erro && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {erro}
                    </div>
                )}
                {erroExportar && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        {erroExportar}
                    </div>
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-center">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-orange-700">
                            <Star className="h-7 w-7 fill-orange-600 text-orange-600" />
                        </div>
                        <h1 className="mt-4 text-2xl font-extrabold text-blue-950">{avaliacao.farmacia}</h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">CNPJ {avaliacao.cnpj}</p>
                        <p className="mt-2 text-sm leading-5 text-slate-600">{avaliacao.endereco}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Avaliado em: {avaliacao.dataTexto} {avaliacao.hora ? `- ${avaliacao.hora}` : ''}</p>
                        <p className="mt-1 text-xs font-semibold uppercase text-blue-900/70">{avaliacao.avaliador}</p>
                    </div>

                    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h2 className="text-base font-extrabold text-blue-950">Resumo da Avaliação</h2>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                            <span>Nota geral:</span>
                            <strong className="text-amber-700">{avaliacao.classificacao}</strong>
                            <span>- {avaliacao.notaGeral}</span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {avaliacao.criterios?.length > 0 ? (
                                avaliacao.criterios.map((criterio) => (
                                    <Criterio criterio={criterio} key={criterio.nome} />
                                ))
                            ) : (
                                <p className="text-sm text-slate-600">A avaliação foi registrada com observações resumidas.</p>
                            )}
                        </div>

                        <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">{avaliacao.resumo}</p>
                    </div>

                    <div className="mt-5 grid gap-3">
                        <button className="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800" type="button" onClick={exportar}>
                            <Download className="h-5 w-5" />
                            Exportar relatório
                        </button>
                        <button className="flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-extrabold text-blue-700 hover:border-sky-300" type="button">
                            <Send className="h-5 w-5" />
                            Reenviar relatório
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}

function Criterio({ criterio }) {
    return (
        <div className="grid grid-cols-[92px_1fr] items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">{criterio.nome}</span>
            <div className="h-2.5 rounded-full bg-sky-100">
                <div className="h-2.5 rounded-full bg-blue-700" style={{ width: `${criterio.valor}%` }} />
            </div>
        </div>
    );
}

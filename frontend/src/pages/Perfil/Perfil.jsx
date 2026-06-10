import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, UserRound } from 'lucide-react';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch, atualizarUsuarioLogado, limparSessao, obterUsuarioLogado } from '../../lib/api.js';

export default function Perfil() {
    const navigate = useNavigate();
    const usuarioLocal = useMemo(() => obterUsuarioLogado(), []);
    const [usuario, setUsuario] = useState(usuarioLocal);
    const [previewFoto, setPreviewFoto] = useState(usuarioLocal?.foto_perfil || usuarioLocal?.fotoPerfil || '');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);

    useEffect(() => {
        let ativo = true;

        async function carregarPerfil() {
            setCarregando(true);
            try {
                const resposta = await apiFetch('/api/meu-perfil');
                if (!ativo) return;

                const perfil = resposta?.user || resposta;
                setUsuario(perfil);
                setPreviewFoto(perfil?.foto_perfil || perfil?.fotoPerfil || '');
                atualizarUsuarioLogado(perfil);
            } catch (error) {
                if (ativo) {
                    setMensagem(error.message);
                    setErro(true);
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarPerfil();
        return () => {
            ativo = false;
        };
    }, []);

    async function selecionarFoto(evento) {
        const arquivo = evento.target.files?.[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith('image/')) {
            setErro(true);
            setMensagem('Escolha uma imagem válida.');
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            setPreviewFoto(String(leitor.result || ''));
            setMensagem('Foto pronta para salvar.');
            setErro(false);
        };

        leitor.readAsDataURL(arquivo);
    }

    async function salvarFoto() {
        if (!previewFoto) {
            setErro(true);
            setMensagem('Selecione uma foto antes de salvar.');
            return;
        }

        setSalvando(true);
        setMensagem('Salvando foto...');
        setErro(false);

        try {
            const resposta = await apiFetch('/api/meu-perfil/foto', {
                method: 'PATCH',
                body: JSON.stringify({ fotoPerfil: previewFoto })
            });

            const perfilAtualizado = resposta?.user || resposta;
            setUsuario(perfilAtualizado);
            setPreviewFoto(perfilAtualizado?.foto_perfil || perfilAtualizado?.fotoPerfil || previewFoto);
            atualizarUsuarioLogado(perfilAtualizado);
            setMensagem('Foto do perfil atualizada.');
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        } finally {
            setSalvando(false);
        }
    }

    function sair() {
        limparSessao();
        navigate('/login');
    }

    const fotoExibida = previewFoto || usuario?.foto_perfil || usuario?.fotoPerfil;

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-extrabold text-blue-700 hover:border-sky-300 hover:bg-sky-50" type="button" onClick={() => navigate('/dashboard')}>Dashboard</button>
                        <div>
                            <p className="text-xs font-bold uppercase text-blue-900/70 sm:text-sm">Perfil do usuário</p>
                            <h1 className="mt-2 text-2xl font-extrabold text-blue-950 sm:text-3xl">Foto e dados de acesso</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Clique na foto para trocar a imagem do seu perfil. A foto aparece no cabeçalho do sistema após salvar.
                            </p>
                        </div>

                        <button
                            className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-extrabold text-red-600 hover:border-red-200 hover:bg-red-50"
                            type="button"
                            onClick={sair}
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
                        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
                                {fotoExibida ? (
                                    <img alt="Foto do perfil" className="h-full w-full object-cover" src={fotoExibida} />
                                ) : (
                                    <UserRound className="h-16 w-16 text-slate-400" />
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-extrabold text-blue-950">{usuario?.nome || 'Usuário'}</h2>
                                <p className="mt-1 text-sm text-slate-500">{usuario?.email || 'email@email.com'}</p>
                                <p className="mt-1 text-xs font-bold uppercase text-blue-900/70">{usuario?.tipo === 'presidente' ? 'Administrador' : 'Avaliador'}</p>
                            </div>

                            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-800">
                                <Camera className="h-4 w-4" />
                                Escolher foto
                                <input accept="image/*" className="hidden" type="file" onChange={selecionarFoto} />
                            </label>

                            <button
                                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-extrabold text-blue-700 hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
                                type="button"
                                onClick={salvarFoto}
                                disabled={carregando || salvando}
                            >
                                Salvar foto
                            </button>
                        </section>

                        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                            <h2 className="text-lg font-extrabold text-blue-950">Dados do perfil</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Info label="Nome" value={usuario?.nome || 'Não informado'} />
                                <Info label="E-mail" value={usuario?.email || 'Não informado'} />
                                <Info label="Tipo de usuário" value={usuario?.tipo === 'presidente' ? 'Administrador' : 'Avaliador'} />
                                <Info label="Status da foto" value={fotoExibida ? 'Foto carregada' : 'Sem foto'} />
                            </div>

                            <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                {carregando ? 'Carregando perfil...' : mensagem || 'Atualize sua foto e ela aparecerá no cabeçalho do sistema.'}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}



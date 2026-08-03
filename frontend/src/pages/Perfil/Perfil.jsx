import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, KeyRound, LogOut, UserRound } from 'lucide-react';
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

        try {
            const foto = await redimensionarFoto(arquivo);
            setPreviewFoto(foto);
            setMensagem('Foto pronta para salvar.');
            setErro(false);
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        }
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
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-bold uppercase text-blue-700 sm:text-xs">Perfil do usuário</p>
                            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-blue-950 sm:text-3xl">Foto e dados de acesso</h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                                Clique na foto para trocar a imagem do seu perfil. A foto aparece no cabeçalho do sistema após salvar.
                            </p>
                        </div>

                        <button
                            className="hidden h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-extrabold text-red-600 hover:border-red-200 hover:bg-red-50 sm:inline-flex"
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
                            </div>

                            {(carregando || mensagem || erro) && (
                                <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                    {carregando ? 'Carregando perfil...' : mensagem}
                                </div>
                            )}

                            <DadosConta
                                usuario={usuario}
                                onAtualizado={(perfil) => {
                                    setUsuario(perfil);
                                    atualizarUsuarioLogado(perfil);
                                }}
                            />
                        </section>

                    </div>

                    <button
                        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 text-sm font-extrabold text-red-700 hover:bg-red-100 sm:hidden"
                        type="button"
                        onClick={sair}
                    >
                        <LogOut className="h-5 w-5" />
                        Sair da conta
                    </button>
                </div>
            </div>
        </main>
    );
}

function DadosConta({ usuario, onAtualizado }) {
    const [form, setForm] = useState({ nome: '', email: '', novaSenha: '', confirmar: '' });
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        setForm((atual) => ({ ...atual, nome: usuario?.nome || '', email: usuario?.email || '' }));
    }, [usuario?.nome, usuario?.email]);

    async function salvar(evento) {
        evento.preventDefault();

        const nome = form.nome.trim();
        const email = form.email.trim().toLowerCase();
        const mudouNome = Boolean(nome) && nome !== (usuario?.nome || '');
        const mudouEmail = Boolean(email) && email !== String(usuario?.email || '').toLowerCase();
        const mudouSenha = Boolean(form.novaSenha);

        if (!mudouNome && !mudouEmail && !mudouSenha) {
            setErro(true);
            setMensagem('Nenhuma alteração para salvar.');
            return;
        }

        if (mudouSenha && form.novaSenha !== form.confirmar) {
            setErro(true);
            setMensagem('A confirmação precisa ser igual à nova senha.');
            return;
        }

        setSalvando(true);
        setErro(false);
        setMensagem('Salvando alterações...');

        const salvos = [];

        try {
            if (mudouNome) {
                const resposta = await apiFetch('/api/meu-perfil/nome', {
                    method: 'PATCH',
                    body: JSON.stringify({ novoNome: nome })
                });
                if (resposta?.user) {
                    onAtualizado?.(resposta.user);
                }
                salvos.push('nome');
            }

            if (mudouEmail) {
                const resposta = await apiFetch('/api/meu-perfil/email', {
                    method: 'PATCH',
                    body: JSON.stringify({ novoEmail: email })
                });
                if (resposta?.user) {
                    onAtualizado?.(resposta.user);
                }
                salvos.push('e-mail');
            }

            if (mudouSenha) {
                await apiFetch('/api/meu-perfil/senha', {
                    method: 'PATCH',
                    body: JSON.stringify({ novaSenha: form.novaSenha })
                });
                salvos.push('senha');
            }

            setForm((atual) => ({ ...atual, novaSenha: '', confirmar: '' }));
            setMensagem(`Alterações salvas: ${salvos.join(', ')}.${mudouEmail ? ' Use o novo e-mail no próximo login.' : ''}`);
        } catch (error) {
            setErro(true);
            setMensagem(salvos.length
                ? `${salvos.join(' e ')} salvo(s), mas houve um problema: ${error.message}`
                : error.message);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <form className="mt-6 border-t border-slate-200 pt-5" onSubmit={salvar}>
            <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-700" />
                <h2 className="text-lg font-extrabold text-blue-950">Dados da conta</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
                Edite o que precisar e clique em salvar as alterações.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nome</span>
                    <input
                        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        type="text"
                        value={form.nome}
                        onChange={(evento) => setForm({ ...form, nome: evento.target.value })}
                        minLength={3}
                        autoComplete="name"
                        required
                    />
                </label>
                <label>
                    <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">E-mail de acesso</span>
                    <input
                        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        type="email"
                        value={form.email}
                        onChange={(evento) => setForm({ ...form, email: evento.target.value })}
                        autoComplete="email"
                        required
                    />
                </label>
            </div>

            <p className="mt-5 text-sm font-bold text-blue-950">Senha</p>
            <p className="mt-1 text-sm text-slate-500">Preencha apenas se quiser trocar a senha (mínimo de 8 caracteres).</p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <CampoSenha label="Nova senha" valor={form.novaSenha} onChange={(valor) => setForm({ ...form, novaSenha: valor })} minimo={8} obrigatorio={false} />
                <CampoSenha label="Confirmar nova senha" valor={form.confirmar} onChange={(valor) => setForm({ ...form, confirmar: valor })} minimo={8} obrigatorio={false} />
            </div>

            <button
                className="mt-5 h-11 rounded-md bg-blue-700 px-8 text-sm font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={salvando}
            >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>

            {mensagem && (
                <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {mensagem}
                </p>
            )}
        </form>
    );
}

function CampoSenha({ label, valor, onChange, minimo = 8, obrigatorio = true }) {
    return (
        <label>
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>
            <input
                className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="password"
                value={valor}
                onChange={(evento) => onChange(evento.target.value)}
                minLength={minimo}
                autoComplete="new-password"
                required={obrigatorio}
            />
        </label>
    );
}

// Reduz a imagem no navegador para o upload ficar leve (máx. 512px, JPEG)
function redimensionarFoto(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        leitor.onload = () => {
            const imagem = new Image();
            imagem.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
            imagem.onload = () => {
                const LADO_MAXIMO = 512;
                const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(imagem.width * escala));
                canvas.height = Math.max(1, Math.round(imagem.height * escala));
                canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            imagem.src = String(leitor.result || '');
        };
        leitor.readAsDataURL(arquivo);
    });
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}



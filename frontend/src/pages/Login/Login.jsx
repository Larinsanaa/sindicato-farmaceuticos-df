import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';

function OndasTopo() {
    return (
        <div className="absolute inset-x-0 top-0 h-[320px] bg-gradient-to-br from-sky-400 via-cyan-300 to-sky-100 sm:h-[360px]">
            <svg className="absolute bottom-0 left-0 h-44 w-full sm:h-52" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 70 C260 150 430 10 720 75 C980 132 1130 150 1440 65 V260 H0 Z" fill="rgba(207, 244, 255, 0.72)" />
                <path d="M0 128 C260 220 500 54 780 128 C1040 198 1180 196 1440 122 V260 H0 Z" fill="#f8fafc" />
            </svg>
        </div>
    );
}

export default function Login() {
    const [tela, setTela] = useState('login');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);

    const [usuarioLogado, setUsuarioLogado] = useState(() => {
        const usuarioSalvo = localStorage.getItem('sindicato_usuario');
        return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    });

    const [login, setLogin] = useState({
        email: '',
        senha: ''
    });

    const [cadastro, setCadastro] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
    });

    function mudarTela(novaTela) {
        setTela(novaTela);
        setMensagem('');
        setErro(false);
        setMostrarSenha(false);
    }

    async function enviarDados(url, dados) {
        const resposta = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.error || 'Nao foi possivel concluir.');
        }

        return resultado;
    }

    async function entrar(evento) {
        evento.preventDefault();
        setCarregando(true);
        setMensagem('Entrando...');
        setErro(false);

        try {
            const resultado = await enviarDados('/api/login', login);

            localStorage.setItem('sindicato_token', resultado.token);
            localStorage.setItem('sindicato_usuario', JSON.stringify(resultado.usuario));
            setUsuarioLogado(resultado.usuario);
            setMensagem('Login realizado com sucesso.');
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        } finally {
            setCarregando(false);
        }
    }

    async function criarConta(evento) {
        evento.preventDefault();

        if (cadastro.senha !== cadastro.confirmarSenha) {
            setErro(true);
            setMensagem('As senhas precisam ser iguais.');
            return;
        }

        setCarregando(true);
        setMensagem('Criando conta...');
        setErro(false);

        try {
            await enviarDados('/api/cadastro', {
                nome: cadastro.nome,
                email: cadastro.email,
                senha: cadastro.senha
            });

            setCadastro({ nome: '', email: '', senha: '', confirmarSenha: '' });
            setTela('login');
            setMensagem('Conta criada com sucesso.');
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        } finally {
            setCarregando(false);
        }
    }

    function sair() {
        localStorage.removeItem('sindicato_token');
        localStorage.removeItem('sindicato_usuario');
        setUsuarioLogado(null);
        setLogin({ email: '', senha: '' });
        setMensagem('');
        setErro(false);
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16">
                            <span className="absolute left-2 top-1 h-4 w-11 rotate-[-22deg] rounded-[100%_0_100%_0] bg-gradient-to-br from-lime-200 to-lime-700 shadow-md" />
                            <span className="absolute left-5 top-3 h-4 w-9 rotate-[-15deg] rounded-[100%_0_100%_0] bg-gradient-to-br from-sky-500 to-blue-950 shadow-md" />
                        </div>
                        <div>
                            <strong className="block text-sm font-extrabold uppercase text-slate-900">Sindicato</strong>
                            <span className="text-xs font-medium text-slate-500">Farmaceuticos DF</span>
                        </div>
                    </div>

                    <button
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
                        type="button"
                        onClick={usuarioLogado ? sair : () => mudarTela(tela === 'login' ? 'cadastro' : 'login')}
                    >
                        {usuarioLogado ? 'Sair' : tela === 'login' ? 'Criar conta' : 'Entrar'}
                    </button>
                </div>
            </header>

            <section className="relative bg-slate-50">
                <OndasTopo />

                <div className="relative mx-auto grid min-h-[calc(100dvh-73px)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:py-16">
                    <div className="max-w-2xl pt-8 lg:pt-0">
                        <p className="mb-4 text-sm font-bold uppercase text-blue-950/70">Portal web</p>
                        <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-blue-950 sm:text-5xl">
                            Sistema de avaliaÃ§Ãµes da Sincofarma-DF
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-blue-950/75">
                            Acesse sua conta para usar o sistema de avaliacoes de farmacias.
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
                        {usuarioLogado ? (
                            <div className="space-y-5">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Login realizado</h2>
                                    <p className="mt-2 text-sm text-slate-500">Voce entrou no sistema.</p>
                                </div>

                                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Usuario</p>
                                    <p className="mt-1 text-sm text-slate-600">{usuarioLogado.nome || 'Usuario'}</p>
                                    <p className="text-sm text-slate-500">{usuarioLogado.email}</p>
                                </div>

                                <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800" type="button" onClick={sair}>
                                    Sair
                                </button>
                            </div>
                        ) : tela === 'cadastro' ? (
                            <form className="space-y-5" onSubmit={criarConta}>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Criar conta</h2>
                                    <p className="mt-2 text-sm text-slate-500">Preencha seus dados.</p>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Nome completo</span>
                                    <div className="relative">
                                        <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" value={cadastro.nome} onChange={(e) => setCadastro({ ...cadastro, nome: e.target.value })} required />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="email" value={cadastro.email} onChange={(e) => setCadastro({ ...cadastro, email: e.target.value })} required />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type={mostrarSenha ? 'text' : 'password'} value={cadastro.senha} onChange={(e) => setCadastro({ ...cadastro, senha: e.target.value })} required />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Confirmar senha</span>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type={mostrarSenha ? 'text' : 'password'} value={cadastro.confirmarSenha} onChange={(e) => setCadastro({ ...cadastro, confirmarSenha: e.target.value })} required />
                                    </div>
                                </label>

                                <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-70" type="submit" disabled={carregando}>
                                    Criar conta
                                </button>

                                <button className="text-sm font-semibold text-blue-700 underline" type="button" onClick={() => mudarTela('login')}>
                                    Ja tenho conta
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-5" onSubmit={entrar}>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Entrar</h2>
                                    <p className="mt-2 text-sm text-slate-500">Acesse sua conta.</p>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} required />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-12 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type={mostrarSenha ? 'text' : 'password'} value={login.senha} onChange={(e) => setLogin({ ...login, senha: e.target.value })} required />
                                        <button className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                                            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </label>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                    <button className="font-semibold text-slate-600 underline" type="button">Esqueceu sua senha?</button>
                                    <button className="font-semibold text-blue-700 underline" type="button" onClick={() => mudarTela('cadastro')}>
                                        Criar conta
                                    </button>
                                </div>

                                <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-70" type="submit" disabled={carregando}>
                                    Entrar
                                </button>
                            </form>
                        )}

                        <p className={`mt-5 min-h-5 text-sm ${erro ? 'text-red-600' : 'text-emerald-700'}`}>
                            {mensagem}
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import TopoOndas from '../components/TopoOndas.jsx';
import { apiFetch, limparSessao, salvarSessao } from '../lib/api.js';

export default function Login() {
    const navigate = useNavigate();
    const [tela, setTela] = useState('login');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);
    const [tipoLogin, setTipoLogin] = useState('avaliador');

    const [login, setLogin] = useState({ email: '', senha: '' });
    const [cadastro, setCadastro] = useState({ nome: '', cpf: '', email: '', senha: '', confirmarSenha: '', tipo: 'avaliador' });

    function mudarTela(novaTela) {
        setTela(novaTela);
        setMensagem('');
        setErro(false);
        setMostrarSenha(false);
    }

    async function entrar(evento) {
        evento.preventDefault();
        setCarregando(true);
        setMensagem('Entrando...');
        setErro(false);

        try {
            const resultado = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(login)
            });

            const usuario = resultado.user || resultado.usuario;

            if (!usuario) {
                throw new Error('Falha ao identificar o usuário autenticado.');
            }

            if (usuario.tipo !== tipoLogin) {
                throw new Error(`Este acesso é de ${usuario.tipo === 'presidente' ? 'administrador' : 'avaliador'}. Selecione o perfil correto.`);
            }

            salvarSessao(resultado.token, usuario);
            navigate('/dashboard');
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
            await apiFetch('/api/cadastro', {
                method: 'POST',
                body: JSON.stringify({
                    nome: cadastro.nome,
                    cpf: cadastro.cpf,
                    email: cadastro.email,
                    senha: cadastro.senha,
                    tipo: cadastro.tipo
                })
            });

            setCadastro({ nome: '', cpf: '', email: '', senha: '', confirmarSenha: '', tipo: 'avaliador' });
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
        limparSessao();
        setLogin({ email: '', senha: '' });
        setTipoLogin('avaliador');
        setMensagem('');
        setErro(false);
        setTela('login');
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao={tela === 'login' ? 'Criar conta' : 'Entrar'} onClick={() => mudarTela(tela === 'login' ? 'cadastro' : 'login')} />

            <section className="relative bg-slate-50">
                <TopoOndas />

                <div className="relative mx-auto grid min-h-[calc(100dvh-73px)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:py-16">
                    <div className="max-w-2xl pt-8 lg:pt-0">
                        <p className="mb-4 text-sm font-bold uppercase text-blue-950/70">Portal web</p>
                        <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-blue-950 sm:text-5xl">
                            Sistema do Sincofarma-DF
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-blue-950/75">
                            Acesse sua conta para usar o sistema de avaliações de farmácias.
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
                        {tela === 'cadastro' ? (
                            <form className="space-y-5" onSubmit={criarConta}>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Criar conta</h2>
                                    <p className="mt-2 text-sm text-slate-500">Preencha seus dados.</p>
                                </div>

                                <Campo texto="Nome completo" icone={<UserRound />} valor={cadastro.nome} onChange={(e) => setCadastro({ ...cadastro, nome: e.target.value })} />
                                <Campo texto="CPF" icone={<CreditCard />} valor={cadastro.cpf} onChange={(e) => setCadastro({ ...cadastro, cpf: e.target.value })} />
                                <Campo texto="E-mail" tipo="email" icone={<Mail />} valor={cadastro.email} onChange={(e) => setCadastro({ ...cadastro, email: e.target.value })} />

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Tipo de usuário</span>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                            value={cadastro.tipo}
                                            onChange={(e) => setCadastro({ ...cadastro, tipo: e.target.value })}
                                        >
                                            <option value="avaliador">Avaliador</option>
                                            <option value="presidente">Administrador</option>
                                        </select>
                                    </div>
                                </label>

                                <Campo texto="Senha" tipo={mostrarSenha ? 'text' : 'password'} icone={<Lock />} valor={cadastro.senha} onChange={(e) => setCadastro({ ...cadastro, senha: e.target.value })} />
                                <Campo texto="Confirmar senha" tipo={mostrarSenha ? 'text' : 'password'} icone={<Lock />} valor={cadastro.confirmarSenha} onChange={(e) => setCadastro({ ...cadastro, confirmarSenha: e.target.value })} />

                                <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-70" type="submit" disabled={carregando}>
                                    Criar conta
                                </button>

                                <button className="text-sm font-semibold text-blue-700 underline" type="button" onClick={() => mudarTela('login')}>
                                    Já tenho conta
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-5" onSubmit={entrar}>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Entrar</h2>
                                    <p className="mt-2 text-sm text-slate-500">Acesse sua conta.</p>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">Entrar como</span>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                            value={tipoLogin}
                                            onChange={(e) => setTipoLogin(e.target.value)}
                                        >
                                            <option value="avaliador">Avaliador</option>
                                            <option value="presidente">Administrador</option>
                                        </select>
                                    </div>
                                </label>

                                <Campo texto="E-mail" tipo="email" icone={<Mail />} valor={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />

                                <Campo texto="Senha" tipo={mostrarSenha ? 'text' : 'password'} icone={<Lock />} valor={login.senha} onChange={(e) => setLogin({ ...login, senha: e.target.value })}>
                                    <button className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                                        {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </Campo>

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

function Campo({ texto, tipo = 'text', icone, valor, onChange, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{texto}</span>
            <div className="relative">
                <span className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                    {icone}
                </span>
                <input className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-12 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type={tipo} value={valor} onChange={onChange} required />
                {children}
            </div>
        </label>
    );
}


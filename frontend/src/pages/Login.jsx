import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import Cabecalho from '../components/Cabecalho.jsx';
import TopoOndas from '../components/TopoOndas.jsx';
import { apiFetch, salvarSessao } from '../lib/api.js';

export default function Login() {
    const navigate = useNavigate();
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);
    const [tipoLogin, setTipoLogin] = useState('avaliador');
    const [login, setLogin] = useState({ email: '', senha: '' });

    async function entrar(evento) {
        evento.preventDefault();
        setCarregando(true);
        setMensagem('Entrando...');
        setErro(false);

        try {
            const resultado = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify(login) });
            const usuario = resultado.user || resultado.usuario;

            if (!usuario || usuario.tipo !== tipoLogin) {
                throw new Error(`Este acesso é de ${usuario?.tipo === 'presidente' ? 'administrador' : 'avaliador'}. Selecione o perfil correto.`);
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

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Entrar" />
            <section className="relative bg-slate-50">
                <TopoOndas />
                <div className="relative mx-auto grid min-h-[calc(100dvh-73px)] max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_440px] lg:py-16">
                    <div className="max-w-2xl pt-8 lg:pt-0">
                        <p className="mb-4 text-sm font-bold uppercase text-blue-950/70">Portal web</p>
                        <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-blue-950 sm:text-5xl">Sistema do Sincofarma-DF</h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-blue-950/75">Acesse sua conta para usar o sistema de avaliações de farmácias.</p>
                    </div>
                    <form className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8" onSubmit={entrar}>
                        <div><h2 className="text-2xl font-extrabold text-slate-900">Entrar</h2><p className="mt-2 text-sm text-slate-500">Acesse sua conta fornecida pela administração.</p></div>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Entrar como</span>
                            <span className="relative block"><ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select className="h-12 w-full rounded-md border border-slate-200 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" value={tipoLogin} onChange={(e) => setTipoLogin(e.target.value)}><option value="avaliador">Avaliador</option><option value="presidente">Administrador</option></select></span>
                        </label>
                        <Campo texto="E-mail" tipo="email" icone={<Mail />} valor={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                        <Campo texto="Senha" tipo={mostrarSenha ? 'text' : 'password'} icone={<Lock />} valor={login.senha} onChange={(e) => setLogin({ ...login, senha: e.target.value })}>
                            <button className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>{mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </Campo>
                        <button className="h-12 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-70" type="submit" disabled={carregando}>Entrar</button>
                        <p className={`min-h-5 text-sm ${erro ? 'text-red-600' : 'text-emerald-700'}`}>{mensagem}</p>
                    </form>
                </div>
            </section>
        </main>
    );
}

function Campo({ texto, tipo = 'text', icone, valor, onChange, children }) {
    const ehEmail = tipo === 'email';

    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{texto}</span>
            <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">{icone}</span>
                <input
                    className={`h-12 w-full rounded-md border border-slate-200 pl-11 text-sm shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 ${children ? 'pr-12' : 'pr-4'}`}
                    type={tipo}
                    value={valor}
                    onChange={onChange}
                    autoComplete={ehEmail ? 'username' : 'current-password'}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                />
                {children}
            </span>
        </label>
    );
}

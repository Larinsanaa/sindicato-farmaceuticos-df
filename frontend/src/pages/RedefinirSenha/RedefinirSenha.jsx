import { useMemo, useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch } from '../../lib/api.js';

export default function RedefinirSenha() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const token = useMemo(() => params.get('token') || '', [params]);
    const [senhas, setSenhas] = useState({ nova: '', confirmar: '' });
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [concluido, setConcluido] = useState(false);

    async function redefinir(evento) {
        evento.preventDefault();
        if (senhas.nova !== senhas.confirmar) {
            setErro(true);
            setMensagem('As senhas precisam ser iguais.');
            return;
        }

        setSalvando(true);
        setErro(false);
        setMensagem('Redefinindo senha...');
        try {
            const resposta = await apiFetch('/api/redefinir-senha', {
                method: 'PATCH',
                body: JSON.stringify({ token, novaSenha: senhas.nova })
            });
            setConcluido(true);
            setMensagem(resposta.message || 'Senha redefinida com sucesso.');
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho textoBotao="Entrar" onClick={() => navigate('/login')} />
            <div className="mx-auto max-w-md px-4 py-10">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="grid h-12 w-12 place-items-center rounded-md bg-blue-100 text-blue-700"><KeyRound className="h-6 w-6" /></span>
                    <h1 className="mt-4 text-2xl font-extrabold text-blue-950">Definir nova senha</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Este link permite alterar somente a senha da sua conta e expira após o uso.</p>
                    {!concluido ? (
                        <form className="mt-6 space-y-4" onSubmit={redefinir}>
                            <CampoSenha label="Nova senha" value={senhas.nova} onChange={(valor) => setSenhas({ ...senhas, nova: valor })} />
                            <CampoSenha label="Confirmar nova senha" value={senhas.confirmar} onChange={(valor) => setSenhas({ ...senhas, confirmar: valor })} />
                            <button className="h-11 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-60" type="submit" disabled={salvando || !token}>Redefinir senha</button>
                        </form>
                    ) : (
                        <button className="mt-6 h-11 w-full rounded-md bg-blue-700 text-sm font-extrabold text-white" type="button" onClick={() => navigate('/login')}>Ir para o login</button>
                    )}
                    {mensagem && <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{mensagem}</p>}
                    {!token && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">Link de redefinição inválido.</p>}
                </section>
            </div>
        </main>
    );
}

function CampoSenha({ label, value, onChange }) {
    return <label><span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span><span className="relative block"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" value={value} onChange={(evento) => onChange(evento.target.value)} minLength="8" required /></span></label>;
}

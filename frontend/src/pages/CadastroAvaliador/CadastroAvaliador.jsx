import { useMemo, useState } from 'react';
import { Copy, CreditCard, Mail, UserPlus, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cabecalho from '../../components/Cabecalho.jsx';
import { apiFetch, obterUsuarioLogado } from '../../lib/api.js';

export default function CadastroAvaliador() {
    const navigate = useNavigate();
    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const [form, setForm] = useState({ nome: '', cpf: '', email: '' });
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [linkInicial, setLinkInicial] = useState('');

    if (usuario?.tipo !== 'presidente') {
        return (
            <main className="min-h-dvh bg-slate-50">
                <Cabecalho />
                <div className="mx-auto max-w-xl p-6">
                    <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Apenas administradores podem cadastrar avaliadores.</p>
                </div>
            </main>
        );
    }

    async function cadastrar(evento) {
        evento.preventDefault();
        setSalvando(true);
        setMensagem('Cadastrando avaliador...');
        setErro(false);

        try {
            const resposta = await apiFetch('/api/avaliadores', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            const link = resposta?.token
                ? `${window.location.origin}/redefinir-senha?token=${encodeURIComponent(resposta.token)}`
                : resposta?.linkInicial || '';

            setForm({ nome: '', cpf: '', email: '' });
            setLinkInicial(link);
            setMensagem(link ? 'Avaliador cadastrado. A primeira senha foi gerada.' : 'Avaliador cadastrado com sucesso.');
        } catch (error) {
            setErro(true);
            setMensagem(error.message);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="min-h-dvh bg-slate-50 text-slate-900">
            <Cabecalho />
            <div className="mx-auto max-w-3xl px-4 py-6 pb-28 sm:px-6 lg:py-8 lg:pb-8">
                <button className="mb-4 text-sm font-bold text-blue-700" type="button" onClick={() => navigate('/dashboard')}>Voltar ao dashboard</button>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-100 text-blue-700"><UserPlus className="h-5 w-5" /></span>
                        <div>
                            <h1 className="text-2xl font-extrabold text-blue-950">Cadastro de avaliador</h1>
                            <p className="mt-1 text-sm text-slate-500">Crie o acesso inicial de um novo avaliador. A senha será definida pelo link de primeira senha.</p>
                        </div>
                    </div>

                    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={cadastrar}>
                        <Campo label="Nome completo" icone={<UserRound />} valor={form.nome} onChange={(valor) => setForm({ ...form, nome: valor })} />
                        <Campo label="CPF" icone={<CreditCard />} valor={form.cpf} onChange={(valor) => setForm({ ...form, cpf: valor.replace(/\D/g, '') })} />
                        <Campo label="E-mail" tipo="email" icone={<Mail />} valor={form.email} onChange={(valor) => setForm({ ...form, email: valor })} />
                        <button className="h-11 rounded-md bg-blue-700 text-sm font-extrabold text-white hover:bg-blue-800 disabled:opacity-60 sm:col-span-2" type="submit" disabled={salvando}>
                            Cadastrar avaliador
                        </button>
                    </form>

                    <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-bold uppercase text-blue-700">Primeira senha</p>
                        {linkInicial ? (
                            <>
                                <p className="mt-1 text-sm text-slate-700">Use este link para o avaliador definir a senha pela primeira vez.</p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <input
                                        className="h-10 min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 text-sm text-slate-700 outline-none"
                                        readOnly
                                        value={linkInicial}
                                    />
                                    <button
                                        className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800"
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(linkInicial);
                                                setMensagem('Link da primeira senha copiado.');
                                                setErro(false);
                                            } catch {
                                                setMensagem('Não foi possível copiar o link da primeira senha.');
                                                setErro(true);
                                            }
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copiar link
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="mt-1 text-sm text-slate-700">O link da primeira senha vai aparecer aqui logo após o cadastro.</p>
                        )}
                    </div>

                    {mensagem && (
                        <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${erro ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                            {mensagem}
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}

function Campo({ label, tipo = 'text', icone, valor, onChange }) {
    const ehCpf = label === 'CPF';

    return (
        <label>
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">{label}</span>
            <span className="relative block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icone}</span>
                <input
                    className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    inputMode={ehCpf ? 'numeric' : undefined}
                    pattern={ehCpf ? '[0-9]*' : undefined}
                    type={tipo}
                    value={valor}
                    onChange={(evento) => onChange(ehCpf ? evento.target.value.replace(/\D/g, '') : evento.target.value)}
                    required
                />
            </span>
        </label>
    );
}

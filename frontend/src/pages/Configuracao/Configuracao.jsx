import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado para fazer o redirecionamento
import Cabecalho from '../../components/Cabecalho.jsx';
import { Shield, User, Settings, LayoutDashboard, Lock, CheckCircle2, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';
import { obterUsuarioLogado } from '../../lib/api.js';

export default function Configuracao() {
    const navigate = useNavigate(); // Inicializando o hook de navegação
    const usuario = useMemo(() => obterUsuarioLogado(), []);
    const tipoUsuario = usuario?.tipo || 'avaliador';

    const [abaAtiva, setAbaAtiva] = useState('perfil');
    
    const [formData, setFormData] = useState({
        nome: usuario?.nome || 'Usuário',
        email: usuario?.email || 'usuario@email.com',
        telefone: '(61) 99999-9999',
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });

    const [notificacao, setNotificacao] = useState({ texto: '', tipo: '' });

    const [avaliadores, setAvaliadores] = useState([
        { id: 1, nome: 'Carlos Souza', email: 'carlos.souza@sindicatodf.com.br', status: 'Ativo', regioes: 'Brasília Centro' },
        { id: 2, nome: 'Mariana Costa', email: 'mariana.costa@sindicatodf.com.br', status: 'Ativo', regioes: 'Taguatinga, Ceilândia' }
    ]);

    const handleInputChange = (campo, valor) => {
        setFormData(prev => ({ ...prev, [campo]: valor }));
    };

    const salvarPerfil = (e) => {
        e.preventDefault();
        setNotificacao({ texto: 'Configurações de perfil updated com sucesso!', tipo: 'sucesso' });
        setTimeout(() => setNotificacao({ texto: '', tipo: '' }), 4000);
    };

    const alterarSenha = (e) => {
        e.preventDefault();
        
        // CORREÇÃO: Validação estrita para impedir senhas com menos de 8 caracteres
        if (formData.novaSenha.length < 8) {
            setNotificacao({ 
                texto: 'A nova senha é muito curta. Ela deve conter no mínimo 8 caracteres.', 
                tipo: 'erro' 
            });
            return;
        }

        if (formData.novaSenha !== formData.confirmarSenha) {
            setNotificacao({ texto: 'A nova senha e a confirmação não coincidem.', tipo: 'erro' });
            return;
        }

        setNotificacao({ texto: 'Senha alterada com sucesso de forma segura!', tipo: 'sucesso' });
        setFormData(prev => ({ ...prev, senhaAtual: '', novaSenha: '', confirmarSenha: '' }));
        setTimeout(() => setNotificacao({ texto: '', tipo: '' }), 4000);
    };

    const alternarStatusAvaliador = (id) => {
        setAvaliadores(prev => prev.map(av => 
            av.id === id ? { ...av, status: av.status === 'Ativo' ? 'Inativo' : 'Ativo' } : av
        ));
    };

    return (
        <main className="min-h-dvh bg-slate-100 text-slate-900">
            <Cabecalho />

            <div className="mx-auto max-w-7xl px-6 py-8">
                {notificacao.texto && (
                    <div className={`mb-4 flex items-center gap-2 rounded-lg p-4 text-sm font-semibold shadow-sm ${
                        notificacao.tipo === 'sucesso' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        {notificacao.texto}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

                    {/* MENU LATERAL */}
                    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm h-fit">
                        <h2 className="mb-4 text-lg font-bold text-slate-900">Configurações</h2>
                        <nav className="space-y-1">
                            <MenuItem ativo={abaAtiva === 'perfil'} texto="Perfil" icone={<User />} onClick={() => setAbaAtiva('perfil')} />
                            <MenuItem ativo={abaAtiva === 'conta'} texto="Conta" icone={<Settings />} onClick={() => setAbaAtiva('conta')} />
                            <MenuItem ativo={abaAtiva === 'seguranca'} texto="Segurança" icone={<Lock />} onClick={() => setAbaAtiva('seguranca')} />
                            <MenuItem ativo={abaAtiva === 'permissoes'} texto="Permissões" icone={<Shield />} onClick={() => setAbaAtiva('permissoes')} />
                            
                            {/* MODIFICAÇÃO: Clicar aqui agora redireciona de volta para a sua página Dashboard */}
                            <MenuItem 
                                ativo={false} 
                                texto="Dashboard" 
                                icone={<LayoutDashboard />} 
                                onClick={() => navigate('/dashboard')} 
                            />
                            
                            {tipoUsuario === 'presidente' && (
                                <MenuItem ativo={abaAtiva === 'admin'} texto="Administração" icone={<Shield />} onClick={() => setAbaAtiva('admin')} />
                            )}
                        </nav>
                    </aside>

                    {/* CONTEÚDO */}
                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">

                        {abaAtiva === 'perfil' && (
                            <form onSubmit={salvarPerfil}>
                                <h1 className="text-2xl font-bold text-slate-900">Perfil</h1>
                                <p className="mt-2 text-slate-500">Gerencie as informações públicas e credenciais sindicais da sua conta.</p>

                                <div className="mt-6 space-y-4">
                                    <Campo label="Nome Completo" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} readOnly={false} />
                                    <Campo label="E-mail Corporativo" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} readOnly={false} type="email" />
                                    <Campo label="Nível de Acesso no Sistema" value={tipoUsuario === 'presidente' ? 'Presidente (Acesso Total)' : 'Avaliador de Campo'} readOnly={true} />
                                    
                                    <button type="submit" className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 transition">
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        )}

                        {abaAtiva === 'conta' && (
                            <form onSubmit={salvarPerfil}>
                                <h1 className="text-2xl font-bold">Conta</h1>
                                <p className="mt-2 text-slate-500">Modifique dados operacionais e de contato direto para avisos do sindicato.</p>

                                <div className="mt-6 space-y-4">
                                    <Campo label="Número de Telefone / WhatsApp" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} readOnly={false} placeholder="(61) 99999-9999" />
                                    <Campo label="Regional Vinculada" value="Sindicato CRF-DF Principal" readOnly={true} />
                                    
                                    <button type="submit" className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 transition">
                                        Atualizar Informações de Contato
                                    </button>
                                </div>
                            </form>
                        )}

                        {abaAtiva === 'seguranca' && (
                            <form onSubmit={alterarSenha}>
                                <h1 className="text-2xl font-bold">Segurança</h1>
                                <p className="mt-2 text-slate-500">Mantenha sua conta protegida alterando credenciais de acesso periodicamente.</p>

                                <div className="mt-6 space-y-4">
                                    <Campo label="Senha Atual" value={formData.senhaAtual} onChange={(e) => handleInputChange('senhaAtual', e.target.value)} type="password" readOnly={false} placeholder="Digite sua senha atual" required />
                                    
                                    {/* Adicionado o atributo minLength para validação nativa do navegador */}
                                    <Campo label="Nova Senha" value={formData.novaSenha} onChange={(e) => handleInputChange('novaSenha', e.target.value)} type="password" readOnly={false} placeholder="Mínimo de 8 caracteres" minLength={8} required />
                                    <Campo label="Confirmar Nova Senha" value={formData.confirmarSenha} onChange={(e) => handleInputChange('confirmarSenha', e.target.value)} type="password" readOnly={false} placeholder="Repita a nova senha" minLength={8} required />

                                    <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 flex items-start gap-3">
                                        <div className="mt-0.5 bg-blue-100 p-1.5 rounded-md text-blue-700">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900">Sessão e Auditoria Ativa</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Seu endereço IP atual está registrado para auditoria de segurança das avaliações do CRF-DF.</p>
                                        </div>
                                    </div>

                                    <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 transition">
                                        Alterar Senha de Acesso
                                    </button>
                                </div>
                            </form>
                        )}

                        {abaAtiva === 'permissoes' && (
                            <>
                                <h1 className="text-2xl font-bold">Permissões</h1>
                                <p className="mt-2 text-slate-500">Escopo técnico determinado pela administração central do sindicato.</p>

                                <div className="mt-6 space-y-4">
                                    {tipoUsuario === 'avaliador' ? (
                                        <>
                                            <Permissao texto="Isolamento de Escopo: Visualizar apenas suas próprias avaliações" ativo />
                                            <Permissao texto="Acesso Administrativo: Entrar no Dashboard de controle da Presidência" ativo={false} />
                                            <Permissao texto="Operação de Campo: Criar e retificar relatórios de avaliações" ativo />
                                        </>
                                    ) : (
                                        <>
                                            <Permissao texto="Auditoria Ampla: Acessar e inspecionar relatórios de todos os avaliadores" ativo />
                                            <Permissao texto="Gestão de Recursos Humanos: Cadastrar e suspender avaliadores" ativo />
                                            <Permissao texto="Coleta de Amostras: Executar preenchimento de novas avaliações de campo" ativo={false} />
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {abaAtiva === 'admin' && tipoUsuario === 'presidente' && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900">Administração Geral</h1>
                                        <p className="text-sm text-slate-500 mt-1">Painel central de controle de recursos e usuários activos do CRF-DF.</p>
                                    </div>
                                    <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 transition">
                                        <UserPlus className="h-3.5 w-3.5" /> Adicionar Avaliador
                                    </button>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Avaliadores sob sua supervisão</h3>
                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold">Nome</th>
                                                    <th className="px-4 py-3 font-bold">Zonas Atendidas</th>
                                                    <th className="px-4 py-3 text-center font-bold">Status</th>
                                                    <th className="px-4 py-3 text-right font-bold">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {avaliadores.map((av) => (
                                                    <tr key={av.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3.5">
                                                            <p className="font-bold text-slate-900">{av.nome}</p>
                                                            <p className="text-xs text-slate-500">{av.email}</p>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-slate-600 text-xs">{av.regioes}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                                                av.status === 'Ativo' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                            }`}>
                                                                {av.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => alternarStatusAvaliador(av.id)}
                                                                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-700 transition"
                                                            >
                                                                <RefreshCw className="h-3 w-3" /> Alterar Status
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                    </section>
                </div>
            </div>
        </main>
    );
}

function MenuItem({ texto, icone, ativo, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-all duration-150 ${
                ativo ? 'bg-blue-700 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
            <span className="[&_svg]:h-4 [&_svg]:w-4">{icone}</span>
            {texto}
        </button>
    );
}

// Atualizado para repassar propriedades como minLength, required, etc., para o input real
function Campo({ label, value, onChange, readOnly = true, type = 'text', placeholder, required = false, minLength }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-600">{label}</label>
            <input
                type={type}
                readOnly={readOnly}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                minLength={minLength}
                className={`mt-1 h-10 w-full rounded-md border border-slate-200 px-3 outline-none text-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                    readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800 border-slate-300'
                }`}
            />
        </div>
    );
}

function Permissao({ texto, ativo }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-white shadow-xs">
            <span className="text-sm font-medium text-slate-700">{texto}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {ativo ? 'Permitido' : 'Bloqueado'}
            </span>
        </div>
    );
}
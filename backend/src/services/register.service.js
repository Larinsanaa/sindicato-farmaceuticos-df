import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { isDemoMode, supabase } from '../config/config.js';
import { demoUsers } from '../config/demoData.js';

class RegisterService {
  async execute({ nome, cpf, email, senha, tipo = 'avaliador' }) {
    const senhaSegura = senha || (tipo === 'avaliador' ? crypto.randomBytes(16).toString('hex') : null);
    const tiposValidos = ['presidente', 'avaliador'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de usuário inválido. Use "presidente" ou "avaliador".');
    }

    if (isDemoMode) {
      const emailNormalizado = String(email || '').trim().toLowerCase();
      const existe = demoUsers.some((user) => user.email === emailNormalizado);

      if (existe) {
        throw new Error('Este e-mail já está em uso.');
      }

      const usuario = {
        id: Date.now(),
        nome: String(nome || '').trim(),
        cpf: String(cpf || '').replace(/\D/g, ''),
        email: emailNormalizado,
        senha: await bcrypt.hash(senhaSegura, 8),
        nivel_acesso: tipo === 'presidente' ? 'presidente' : 'usuario'
      };

      demoUsers.push(usuario);
      return { ...usuario, tipo };
    }

    const cpfNormalizado = String(cpf || '').replace(/\D/g, '');
    if (!nome?.trim() || !email?.trim() || (tipo !== 'avaliador' && !senha) || cpfNormalizado.length !== 11) {
      throw new Error('Nome, CPF, e-mail e senha são obrigatórios.');
    }

    const emailNormalizado = email.trim().toLowerCase();
    const { data: userExists, error: findError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (findError) {
      throw new Error('Erro ao consultar o e-mail informado.');
    }

    if (userExists) {
      throw new Error('Este e-mail já está em uso.');
    }

    const senhaCriptografada = await bcrypt.hash(senhaSegura, 8);
    const { data: user, error: createError } = await supabase
      .from('usuarios')
      .insert([{
        nome: nome.trim(),
        cpf: cpfNormalizado,
        email: emailNormalizado,
        senha: senhaCriptografada,
        nivel_acesso: tipo === 'presidente' ? 'presidente' : 'usuario'
      }])
      .select('id, nome, email, nivel_acesso')
      .single();

    if (createError) {
      throw new Error('Erro ao salvar o usuário no banco de dados.');
    }

    return { ...user, tipo };
  }
}

export default new RegisterService();

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabase } from '../config/config.js';

class RegisterService {
  async execute({ nome, cpf, email, senha, tipo = 'avaliador' }) {
    const tiposValidos = ['presidente', 'avaliador'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de usuário inválido. Use "presidente" ou "avaliador".');
    }

    const cpfNormalizado = String(cpf || '').replace(/\D/g, '');
    if (!nome?.trim() || !email?.trim() || cpfNormalizado.length !== 11) {
      throw new Error('Nome, CPF e e-mail são obrigatórios.');
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

    const senhaSegura = senha || crypto.randomBytes(16).toString('hex');
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

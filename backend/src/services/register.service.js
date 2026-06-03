import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import { supabase } from '../config/config.js';


class RegisterService {
  async execute({ nome, email, senha, tipo = 'avaliador' }) {
    if (!nome || !email || !senha) {
      throw new Error('Nome, e-mail e senha são obrigatórios para cadastro.');
    }

    const tiposValidos = ['presidente', 'avaliador'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de usuário inválido. Use "presidente" ou "avaliador".');
    }

    const { data: existingUser, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error('Erro ao verificar e-mail. Tente novamente mais tarde.');
    }

    if (existingUser) {
      throw new Error('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(senha, 8);

    // Repassa os dados consolidados, salvando a senha mascarada no banco
    const user = await User.create({
      nome,
      email,
      senha: hashedPassword,
      tipo
    });

    // Remove a propriedade de senha do objeto resultante antes de devolvê-lo (por segurança)
    delete user.senha;
    
    // Entrega o objeto limpo de volta ao Controller
    return user;
  }
}

export default new RegisterService();
import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/config';


class RegisterService {
  async execute({ nome, email, senha, tipo = 'avaliador' }) {
    // Validar se o tipo de usuário é válido
    const tiposValidos = ['presidente', 'avaliador'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de usuário inválido. Use "presidente" ou "avaliador".'); 
    }

    const userExists = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email)
        .single();
    
    if (userExists) {
      throw new Error('Este e-mail já está em uso.'); 
    } 

    const hashedPassword = await bcrypt.hash(senha, 8); 

    // Repassa os dados consolidados, salvando a senha mascarada no banco
    const user = await User.create({
      nome,
      email,
      password: hashedPassword,
      tipo
    }); 

    // Remove a propriedade de senha do objeto resultante antes de devolvê-lo (por segurança)
    delete user.password; 
    
    // Entrega o objeto limpo de volta ao Controller
    return user; 
  }
}

module.exports = new RegisterService();
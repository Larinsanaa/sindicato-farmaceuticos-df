import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtSecret, supabase } from '../config/config.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

class LoginService {
  async execute({ email, senha }) {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', String(email || '').trim().toLowerCase())
      .maybeSingle();

    if (error || !user || !await bcrypt.compare(String(senha || ''), user.senha)) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const token = jwt.sign(
      { id: user.id },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: obterTipoUsuario(user),
        foto_perfil: null
      },
      token
    };
  }
}

export default new LoginService();

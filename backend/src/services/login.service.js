import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isDemoMode, jwtSecret, supabase } from '../config/config.js';
import { demoUsers } from '../config/demoData.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

class LoginService {
  async execute({ email, senha }) {
    if (isDemoMode) {
      const user = demoUsers.find((item) => item.email === String(email || '').trim().toLowerCase());

      if (!user || String(senha || '') !== user.senha) {
        throw new Error('E-mail ou senha incorretos.');
      }

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo,
          foto_perfil: user.foto_perfil || null
        },
        token: jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' })
      };
    }

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
        foto_perfil: user.foto_perfil || null
      },
      token
    };
  }
}

export default new LoginService();

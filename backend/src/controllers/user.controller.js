import { supabase } from '../config/config.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

class UserController {
  async getProfile(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, nivel_acesso')
        .eq('id', req.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.json({
        user: {
          ...user,
          tipo: obterTipoUsuario(user),
          foto_perfil: null
        }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
    }
  }

  async updateAvatar(req, res) {
    const { fotoPerfil } = req.body;

    if (!fotoPerfil || typeof fotoPerfil !== 'string' || !fotoPerfil.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Envie uma imagem válida em base64.' });
    }

    return res.status(501).json({ error: 'O banco de dados ainda não possui suporte para foto de perfil.' });
  }
}

export default new UserController();

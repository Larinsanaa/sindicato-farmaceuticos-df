import { supabase } from '../config/config.js';

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.userId;

      const { data: user, error } = await supabase
<<<<<<< HEAD
        .from('usuario')
        .select('id, nome, email, tipo, foto_perfil')
=======
        .from('usuarios')
        .select('id, nome, email, tipo')
>>>>>>> 9a2dcbf (BACKEND: validação de avaliação com CNPJ e localização ativa)
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.json({ user });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar perfil do usuário.' });
    }
  }

  async updateAvatar(req, res) {
    try {
      const userId = req.userId;
      const { fotoPerfil } = req.body;

      if (!fotoPerfil || typeof fotoPerfil !== 'string' || !fotoPerfil.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Envie uma imagem válida em base64.' });
      }

      const { data: user, error } = await supabase
        .from('usuario')
        .update({ foto_perfil: fotoPerfil })
        .eq('id', userId)
        .select('id, nome, email, tipo, foto_perfil')
        .single();

      if (error || !user) {
        return res.status(500).json({ error: 'Não foi possível atualizar a foto do perfil.' });
      }

      return res.json({ user });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar foto do perfil.' });
    }
  }
}

export default new UserController();

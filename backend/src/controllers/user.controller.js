import { supabase } from '../config/config.js';

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.userId;

      const { data: user, error } = await supabase
        .from('usuario')
        .select('id, nome, email, tipo')
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
}

export default new UserController();

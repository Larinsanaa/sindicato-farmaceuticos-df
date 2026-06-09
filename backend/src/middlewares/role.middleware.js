import { supabase } from '../config/config.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

// Middleware para verificar o tipo (role) do usuário
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nivel_acesso')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      const userRole = obterTipoUsuario(user);

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
      }

      req.userRole = userRole;
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao verificar permissões.' });
    }
  };
};

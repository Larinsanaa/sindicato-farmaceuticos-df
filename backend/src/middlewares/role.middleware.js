import { supabase } from '../config/config';

// Middleware para verificar o tipo (role) do usuário
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const { data: user, error } = await supabase
        .from('usuario')
        .select('tipo')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      if (!allowedRoles.includes(user.tipo)) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
      }

      req.userRole = user.tipo;
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao verificar permissões.' });
    }
  };
};

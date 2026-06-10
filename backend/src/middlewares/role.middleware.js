import { isDemoMode, supabase } from '../config/config.js';
import { demoUsers } from '../config/demoData.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

// Middleware para verificar o tipo (role) do usuário
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (isDemoMode) {
        const user = demoUsers.find((item) => String(item.id) === String(userId));

        if (!user) {
          return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        const userRole = user.tipo;

        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
        }

        req.userRole = userRole;
        return next();
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
    } catch {
      return res.status(500).json({ error: 'Erro ao verificar permissões.' });
    }
  };
};

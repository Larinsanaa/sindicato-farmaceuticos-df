import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RegisterService from '../services/register.service.js';
import LoginService from '../services/login.service.js';
import { supabase, jwtSecret } from '../config/config.js';

class AuthController {
  async registerEvaluator(req, res) {
    try {
      const user = await RegisterService.execute({ ...req.body, tipo: 'avaliador' });

      const { data: userBanco, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, senha, nivel_acesso')
        .eq('id', user.id)
        .single();

      if (error || !userBanco) {
        return res.status(201).json({ ...user, linkInicial: null });
      }

      const senhaVersao = crypto.createHash('sha256').update(userBanco.senha).digest('hex');
      const token = jwt.sign(
        { id: userBanco.id, purpose: 'password-reset', senhaVersao },
        jwtSecret,
        { expiresIn: '30m' }
      );

      return res.status(201).json({
        ...user,
        token,
        expiresInMinutes: 30,
        linkInicial: `${req.protocol}://${req.get('host')}/redefinir-senha?token=${encodeURIComponent(token)}`
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const data = await LoginService.execute(req.body);
      return res.json(data);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();

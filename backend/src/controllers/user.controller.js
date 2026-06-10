import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../config/config.js';
import { jwtSecret } from '../config/config.js';
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
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      return res.json({
        user: { ...user, tipo: obterTipoUsuario(user), foto_perfil: null }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao buscar perfil do usuario.' });
    }
  }

  async updateAvatar(req, res) {
    const { fotoPerfil } = req.body;

    if (!fotoPerfil || typeof fotoPerfil !== 'string' || !fotoPerfil.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Envie uma imagem valida em base64.' });
    }

    return res.status(501).json({ error: 'O banco de dados ainda nao possui suporte para foto de perfil.' });
  }

  async listEvaluators(req, res) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, cpf, email, nivel_acesso, ativo')
        .eq('nivel_acesso', 'usuario')
        .order('nome');

      if (error) {
        return res.status(500).json({ error: 'Nao foi possivel listar os avaliadores.' });
      }

      return res.json({ avaliadores: data || [] });
    } catch {
      return res.status(500).json({ error: 'Erro ao listar avaliadores.' });
    }
  }

  async createPasswordResetLink(req, res) {
    try {
      const { id } = req.params;
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, senha, nivel_acesso')
        .eq('id', id)
        .single();

      if (error || !user || user.nivel_acesso !== 'usuario') {
        return res.status(404).json({ error: 'Avaliador nao encontrado.' });
      }

      const senhaVersao = crypto.createHash('sha256').update(user.senha).digest('hex');
      const token = jwt.sign(
        { id: user.id, purpose: 'password-reset', senhaVersao },
        jwtSecret,
        { expiresIn: '30m' }
      );

      return res.json({ token, expiresInMinutes: 30, avaliador: { id: user.id, nome: user.nome, email: user.email } });
    } catch {
      return res.status(500).json({ error: 'Erro ao gerar link de redefinicao.' });
    }
  }

  async updateEvaluatorStatus(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ error: 'Informe se o avaliador deve ficar ativo ou inativo.' });
      }

      const { data: user, error: findError } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, nivel_acesso, ativo')
        .eq('id', id)
        .single();

      if (findError || !user || user.nivel_acesso !== 'usuario') {
        return res.status(404).json({ error: 'Avaliador nao encontrado.' });
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({ ativo })
        .eq('id', id)
        .select('id, nome, email, cpf, nivel_acesso, ativo')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Nao foi possivel atualizar o status do avaliador.' });
      }

      return res.json({ avaliador: data });
    } catch {
      return res.status(500).json({ error: 'Erro ao atualizar status do avaliador.' });
    }
  }

  async resetPasswordWithToken(req, res) {
    try {
      const { token, novaSenha } = req.body;
      if (!token || !novaSenha || String(novaSenha).length < 8) {
        return res.status(400).json({ error: 'Informe um link valido e uma senha com pelo menos 8 caracteres.' });
      }

      const payload = jwt.verify(token, jwtSecret);
      if (payload.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Link de redefinicao invalido.' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, senha')
        .eq('id', payload.id)
        .single();

      const senhaVersaoAtual = user
        ? crypto.createHash('sha256').update(user.senha).digest('hex')
        : '';

      if (error || !user || senhaVersaoAtual !== payload.senhaVersao) {
        return res.status(400).json({ error: 'Este link ja foi utilizado ou nao e mais valido.' });
      }

      const senhaCriptografada = await bcrypt.hash(String(novaSenha), 8);
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ senha: senhaCriptografada })
        .eq('id', user.id);

      if (updateError) {
        return res.status(500).json({ error: 'Nao foi possivel redefinir a senha.' });
      }

      return res.json({ message: 'Senha redefinida com sucesso.' });
    } catch {
      return res.status(400).json({ error: 'Link expirado ou invalido.' });
    }
  }
}

export default new UserController();

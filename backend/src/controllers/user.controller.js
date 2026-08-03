import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/config.js';
import { jwtSecret } from '../config/config.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

class UserController {
  async getProfile(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .eq('id', req.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      return res.json({
        user: { ...user, tipo: obterTipoUsuario(user) }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao buscar perfil do usuario.' });
    }
  }

  async updateAvatar(req, res) {
    try {
      const { fotoPerfil } = req.body;

      if (!fotoPerfil || typeof fotoPerfil !== 'string' || !fotoPerfil.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Envie uma imagem valida em base64.' });
      }

      // ~2.5MB de imagem depois do base64
      if (fotoPerfil.length > 3_500_000) {
        return res.status(400).json({ error: 'A imagem e muito grande. Escolha uma foto menor.' });
      }

      const { data: atualizado, error } = await supabase
        .from('usuarios')
        .update({ foto_perfil: fotoPerfil })
        .eq('id', req.userId)
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .single();

      if (error || !atualizado) {
        return res.status(500).json({ error: 'Nao foi possivel salvar a foto de perfil.' });
      }

      return res.json({
        message: 'Foto de perfil atualizada.',
        user: { ...atualizado, tipo: obterTipoUsuario(atualizado) }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao salvar a foto de perfil.' });
    }
  }

  async changePassword(req, res) {
    try {
      const { novaSenha } = req.body;

      if (!novaSenha || String(novaSenha).length < 8) {
        return res.status(400).json({ error: 'Informe uma nova senha com pelo menos 8 caracteres.' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, senha')
        .eq('id', req.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      const senhaIgualAtual = await bcrypt.compare(String(novaSenha), user.senha);
      if (senhaIgualAtual) {
        return res.status(400).json({ error: 'A nova senha precisa ser diferente da atual.' });
      }

      const senhaCriptografada = await bcrypt.hash(String(novaSenha), 8);
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ senha: senhaCriptografada })
        .eq('id', user.id);

      if (updateError) {
        return res.status(500).json({ error: 'Nao foi possivel alterar a senha.' });
      }

      return res.json({ message: 'Senha alterada com sucesso.' });
    } catch {
      return res.status(500).json({ error: 'Erro ao alterar a senha.' });
    }
  }

  async changeName(req, res) {
    try {
      const novoNome = String(req.body?.novoNome || '').trim().replace(/\s+/g, ' ');

      if (novoNome.length < 3) {
        return res.status(400).json({ error: 'Informe um nome com pelo menos 3 caracteres.' });
      }

      const { data: atualizado, error } = await supabase
        .from('usuarios')
        .update({ nome: novoNome })
        .eq('id', req.userId)
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .single();

      if (error || !atualizado) {
        return res.status(500).json({ error: 'Nao foi possivel alterar o nome.' });
      }

      return res.json({
        message: 'Nome alterado com sucesso.',
        user: { ...atualizado, tipo: obterTipoUsuario(atualizado) }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao alterar o nome.' });
    }
  }

  async changeEmail(req, res) {
    try {
      const { novoEmail } = req.body;
      const emailNormalizado = String(novoEmail || '').trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
        return res.status(400).json({ error: 'Informe um e-mail valido.' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('id', req.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuario nao encontrado.' });
      }

      if (emailNormalizado === String(user.email).toLowerCase()) {
        return res.status(400).json({ error: 'O novo e-mail precisa ser diferente do atual.' });
      }

      const { data: jaExiste } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailNormalizado)
        .maybeSingle();

      if (jaExiste) {
        return res.status(409).json({ error: 'Este e-mail ja esta em uso por outra conta.' });
      }

      const { data: atualizado, error: updateError } = await supabase
        .from('usuarios')
        .update({ email: emailNormalizado })
        .eq('id', user.id)
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Nao foi possivel alterar o e-mail.' });
      }

      return res.json({
        message: 'E-mail alterado com sucesso. Use o novo e-mail no proximo login.',
        user: { ...atualizado, tipo: obterTipoUsuario(atualizado) }
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao alterar o e-mail.' });
    }
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

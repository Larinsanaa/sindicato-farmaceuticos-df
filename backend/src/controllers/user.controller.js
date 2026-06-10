import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { isDemoMode, supabase, jwtSecret } from '../config/config.js';
import { demoUsers } from '../config/demoData.js';
import { obterTipoUsuario } from '../utils/userRole.util.js';

class UserController {
  async getProfile(req, res) {
    try {
      if (isDemoMode) {
        const user = demoUsers.find((item) => String(item.id) === String(req.userId));

        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.json({
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            cpf: user.cpf || null,
            tipo: user.tipo,
            foto_perfil: user.foto_perfil || null
          }
        });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .eq('id', req.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.json({
        user: {
          ...user,
          tipo: obterTipoUsuario(user),
          foto_perfil: user.foto_perfil || null
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

    try {
      if (isDemoMode) {
        const user = demoUsers.find((item) => String(item.id) === String(req.userId));

        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        user.foto_perfil = fotoPerfil;

        return res.json({
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            cpf: user.cpf || null,
            tipo: user.tipo,
            foto_perfil: user.foto_perfil
          }
        });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .update({ foto_perfil: fotoPerfil })
        .eq('id', req.userId)
        .select('id, nome, email, cpf, nivel_acesso, foto_perfil')
        .single();

      if (error || !user) {
        console.error('Erro ao salvar foto:', error);
        return res.status(500).json({ error: 'Não foi possível salvar a foto de perfil.' });
      }

      return res.json({
        user: {
          ...user,
          tipo: obterTipoUsuario(user),
          foto_perfil: user.foto_perfil || null
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar a foto de perfil.' });
    }
  }

  async listEvaluators(req, res) {
    try {
      if (isDemoMode) {
        const avaliadores = demoUsers
          .filter((item) => item.nivel_acesso === 'usuario')
          .map((item) => ({
            id: item.id,
            nome: item.nome,
            cpf: item.cpf || null,
            email: item.email,
            tipo: item.tipo,
            ativo: item.ativo ?? true
          }));

        return res.json({ avaliadores });
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, cpf, email, nivel_acesso, ativo')
        .eq('nivel_acesso', 'usuario')
        .order('nome');

      if (error) {
        return res.status(500).json({ error: 'Não foi possível listar os avaliadores.' });
      }

      return res.json({ avaliadores: data || [] });
    } catch {
      return res.status(500).json({ error: 'Erro ao listar avaliadores.' });
    }
  }

  async createPasswordResetLink(req, res) {
    try {
      const { id } = req.params;
      let user = null;

      if (isDemoMode) {
        user = demoUsers.find((item) => String(item.id) === String(id));
      } else {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nome, email, senha, nivel_acesso')
          .eq('id', id)
          .single();

        if (!error) {
          user = data;
        }
      }

      if (!user || user.nivel_acesso !== 'usuario') {
        return res.status(404).json({ error: 'Avaliador não encontrado.' });
      }

      const senhaVersao = crypto.createHash('sha256').update(user.senha).digest('hex');
      const token = jwt.sign(
        { id: user.id, purpose: 'password-reset', senhaVersao },
        jwtSecret,
        { expiresIn: '30m' }
      );

      return res.json({
        token,
        expiresInMinutes: 30,
        avaliador: { id: user.id, nome: user.nome, email: user.email },
        linkInicial: `${req.protocol}://${req.get('host')}/redefinir-senha?token=${encodeURIComponent(token)}`
      });
    } catch {
      return res.status(500).json({ error: 'Erro ao gerar link de redefinição.' });
    }
  }

  async updateEvaluatorStatus(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ error: 'Informe se o avaliador deve ficar ativo ou inativo.' });
      }

      if (isDemoMode) {
        const avaliador = demoUsers.find((item) => String(item.id) === String(id));

        if (!avaliador || avaliador.nivel_acesso !== 'usuario') {
          return res.status(404).json({ error: 'Avaliador não encontrado.' });
        }

        avaliador.ativo = ativo;

        return res.json({ avaliador });
      }

      const { data: existingUser, error: findError } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf, nivel_acesso, ativo')
        .eq('id', id)
        .single();

      if (findError || !existingUser || existingUser.nivel_acesso !== 'usuario') {
        return res.status(404).json({ error: 'Avaliador não encontrado.' });
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({ ativo })
        .eq('id', id)
        .select('id, nome, email, cpf, nivel_acesso, ativo')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Não foi possível atualizar o status do avaliador.' });
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
        return res.status(400).json({ error: 'Informe um link válido e uma senha com pelo menos 8 caracteres.' });
      }

      const payload = jwt.verify(token, jwtSecret);
      if (payload.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Link de redefinição inválido.' });
      }

      let user = null;
      if (isDemoMode) {
        user = demoUsers.find((item) => String(item.id) === String(payload.id));
      } else {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, senha')
          .eq('id', payload.id)
          .single();

        if (!error) {
          user = data;
        }
      }

      if (!user) {
        return res.status(400).json({ error: 'Este link já foi utilizado ou não é mais válido.' });
      }

      const senhaVersaoAtual = crypto.createHash('sha256').update(user.senha).digest('hex');
      if (senhaVersaoAtual !== payload.senhaVersao) {
        return res.status(400).json({ error: 'Este link já foi utilizado ou não é mais válido.' });
      }

      if (isDemoMode) {
        user.senha = String(novaSenha);
      } else {
        const senhaCriptografada = await bcrypt.hash(String(novaSenha), 8);
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ senha: senhaCriptografada })
          .eq('id', user.id);

        if (updateError) {
          return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
        }
      }

      return res.json({ message: 'Senha redefinida com sucesso.' });
    } catch {
      return res.status(400).json({ error: 'Link expirado ou inválido.' });
    }
  }
}

export default new UserController();

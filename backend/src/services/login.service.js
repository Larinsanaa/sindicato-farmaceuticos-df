<<<<<<< HEAD
﻿const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/config');
=======
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase, jwtSecret } from '../config/config.js';
>>>>>>> 9a2dcbf (BACKEND: validação de avaliação com CNPJ e localização ativa)

class LoginService {
  async execute({ email, senha }) {

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (!user) {
      throw new Error('E-mail ou senha incorretos.'); 
    } 


    const passwordMatch = await bcrypt.compare(senha, user.senha); 
    
    // Se a validaÃ§Ã£o da senha falhar, barra com a mesma mensagem genÃ©rica
    if (!passwordMatch) {
      throw new Error('E-mail ou senha incorretos.'); 
    } 

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: '1h'
    });

    // Retorna os dados resumidos do perfil logado, o tipo de usuÃ¡rio e o token gerado
    return {
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, foto_perfil: user.foto_perfil || null },
      token
    }; 
  }
}

<<<<<<< HEAD
module.exports = new LoginService();
=======
export default new LoginService();
>>>>>>> 9a2dcbf (BACKEND: validação de avaliação com CNPJ e localização ativa)

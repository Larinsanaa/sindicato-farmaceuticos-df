const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/config');

class LoginService {
  async execute({ email, senha }) {

    const { data: user, error } = await supabase
      .from('usuario')
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

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h' 
    }); 

    // Retorna os dados resumidos do perfil logado, o tipo de usuÃ¡rio e o token gerado
    return {
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, foto_perfil: user.foto_perfil || null },
      token
    }; 
  }
}

module.exports = new LoginService();

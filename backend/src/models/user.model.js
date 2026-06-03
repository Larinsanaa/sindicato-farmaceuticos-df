import { supabase } from '../config/config.js';

class UserModel {
  // Busca um usuário por e-mail
  async findByEmail(email) {
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email); // Retorna um array com os resultados

    if (error) {
        console.error("Erro crítico ao buscar usuário por email:", error);
        throw new Error("Erro interno ao consultar o banco de dados.");
    }

    if (usuario.length === 0) {
        return null;
    }

    return usuario[0];
  } 

  async create(userData) {
    const { data, error } = await supabase
        .from('usuarios')
        .insert([userData])
        .select(); 
    
    if (error) {
        console.error("Erro ao inserir usuário no Supabase:", error);
        throw new Error("Erro ao salvar o usuário no banco de dados.");
    }

    return data[0]; 
  }
}

export default new UserModel();
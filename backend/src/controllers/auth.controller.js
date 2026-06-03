<<<<<<< HEAD
﻿const RegisterService = require('../services/register.service');
const LoginService = require('../services/login.service');
=======
import RegisterService from '../services/register.service.js';
import LoginService from '../services/login.service.js';
>>>>>>> 9a2dcbf (BACKEND: validação de avaliação com CNPJ e localização ativa)

class AuthController {
  async register(req, res) {
    try {
      // Coleta o corpo da requisiÃ§Ã£o e envia para o serviÃ§o de registro processar
      const user = await RegisterService.execute(req.body); 
      
      // Se der certo, retorna o status HTTP 201 (Criado) com os dados do usuÃ¡rio
      return res.status(201).json(user); 
    } catch (error) {
      // Se ocorrer uma falha nas regras, captura o erro e envia status 400 (Bad Request)
      return res.status(400).json({ error: error.message }); 
    }
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body; 
      
      // Solicita a validaÃ§Ã£o de login ao respectivo serviÃ§o
      const data = await LoginService.execute({ email, senha }); 
      
      // Retorna em formato JSON os dados pÃºblicos do usuÃ¡rio e seu token de acesso
      return res.json(data); 
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

<<<<<<< HEAD
// Exporta uma instÃ¢ncia ativa da classe Controller
module.exports = new AuthController();
=======
// Exporta uma instância ativa da classe Controller
export default new AuthController();
>>>>>>> 9a2dcbf (BACKEND: validação de avaliação com CNPJ e localização ativa)

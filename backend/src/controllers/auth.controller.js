const RegisterService = require('../services/register.service');
const LoginService = require('../services/login.service');

class AuthController {
  async register(req, res) {
    try {
      // Coleta o corpo da requisição e envia para o serviço de registro processar
      const user = await RegisterService.execute(req.body); 
      
      // Se der certo, retorna o status HTTP 201 (Criado) com os dados do usuário
      return res.status(201).json(user); 
    } catch (error) {
      // Se ocorrer uma falha nas regras, captura o erro e envia status 400 (Bad Request)
      return res.status(400).json({ error: error.message }); 
    }
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body; 
      
      // Solicita a validação de login ao respectivo serviço
      const data = await LoginService.execute({ email, senha }); 
      
      // Retorna em formato JSON os dados públicos do usuário e seu token de acesso
      return res.json(data); 
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

// Exporta uma instância ativa da classe Controller
module.exports = new AuthController();
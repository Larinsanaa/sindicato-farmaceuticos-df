import Router from 'express';
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');


const routes = Router();

// Rota pública: recebe dados de novos usuários e aciona o método de cadastro do Controller
routes.post('/register', AuthController.register); 

// Rota pública: recebe credenciais e aciona o método de login do Controller
routes.post('/login', AuthController.login); 

// Rota Protegida: O 'authMiddleware' intercepta a requisição. 
// Se o token for válido, permite o acesso ao bloco final que responde ao cliente.
routes.get('/dashboard', authMiddleware, (req, res) => {
  console.log(`Acesso autorizado para usuário ID: ${req.userId}`); // Debug: mostra o ID do usuário autenticado no console
  return res.json({ 
    message: `Bem-vindo ao painel! Seu ID de usuário autenticado é o ${req.userId}` 
  });
});

module.exports = routes;
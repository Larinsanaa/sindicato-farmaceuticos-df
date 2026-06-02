import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import UserController from '../controllers/user.controller.js';

const routes = express.Router();

routes.post('/register', AuthController.register);
routes.post('/cadastro', AuthController.register);
routes.post('/login', AuthController.login);

routes.get('/dashboard', authMiddleware, (req, res) => {
  console.log(`Acesso autorizado para usuário ID: ${req.userId}`);
  return res.json({
    message: `Bem-vindo ao painel! Seu ID de usuário autenticado é o ${req.userId}`
  });
});

routes.get('/meu-perfil', authMiddleware, checkRole('presidente', 'avaliador'), UserController.getProfile);
routes.patch('/meu-perfil/foto', authMiddleware, checkRole('presidente', 'avaliador'), UserController.updateAvatar);

routes.get('/painel-presidente', authMiddleware, checkRole('presidente'), (req, res) => {
  return res.json({ message: 'Bem-vindo ao painel do presidente!' });
});

routes.get('/painel-avaliador', authMiddleware, checkRole('avaliador'), (req, res) => {
  return res.json({ message: 'Bem-vindo ao painel do avaliador!' });
});

routes.get('/painel-geral', authMiddleware, checkRole('presidente', 'avaliador'), (req, res) => {
  return res.json({ message: 'Bem-vindo ao painel geral!' });
});

export default routes;

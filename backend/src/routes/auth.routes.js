import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import UserController from '../controllers/user.controller.js';

const routes = express.Router();

routes.post('/cadastro', AuthController.register);
routes.post('/login', AuthController.login);
routes.post('/avaliadores', authMiddleware, checkRole('presidente'), AuthController.registerEvaluator);
routes.get('/avaliadores', authMiddleware, checkRole('presidente'), UserController.listEvaluators);
routes.patch('/avaliadores/:id/status', authMiddleware, checkRole('presidente'), UserController.updateEvaluatorStatus);
routes.post('/avaliadores/:id/link-redefinicao', authMiddleware, checkRole('presidente'), UserController.createPasswordResetLink);
routes.patch('/redefinir-senha', UserController.resetPasswordWithToken);

routes.get('/meu-perfil', authMiddleware, checkRole('presidente', 'avaliador'), UserController.getProfile);
routes.patch('/meu-perfil/foto', authMiddleware, checkRole('presidente', 'avaliador'), UserController.updateAvatar);

export default routes;

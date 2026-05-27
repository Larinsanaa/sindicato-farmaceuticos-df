import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { checkRole } from '../middlewares/role.middleware.js';
import EvaluationController from '../controllers/evaluation.controller.js';

const routes = express.Router();

routes.post(
  '/avaliacoes',
  authMiddleware,
  checkRole('avaliador'),
  EvaluationController.create
);

routes.get(
  '/avaliacoes',
  authMiddleware,
  checkRole('presidente', 'avaliador'),
  EvaluationController.list
);

routes.get(
  '/avaliacoes/:id',
  authMiddleware,
  checkRole('presidente', 'avaliador'),
  EvaluationController.detail
);

export default routes;

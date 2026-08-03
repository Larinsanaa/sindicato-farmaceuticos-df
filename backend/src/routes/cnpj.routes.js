import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import CnpjController from '../controllers/cnpj.controller.js';

const routes = express.Router();

routes.get('/cnpj/:cnpj', authMiddleware, CnpjController.lookup);

export default routes;

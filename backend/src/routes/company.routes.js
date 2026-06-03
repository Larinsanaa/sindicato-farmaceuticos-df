import express from 'express';
import CompanyController from '../controllers/company.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import cnpjMiddleware from '../middlewares/cnpj.middleware.js';

const routes = express.Router();

// Para cadastrar uma empresa, o usuário precisa estar autenticado (authMiddleware) 
// E o CNPJ enviado precisa ser válido (cnpjMiddleware)
routes.post('/company/register', authMiddleware, cnpjMiddleware, CompanyController.create);

export default routes;
const { Router } = require('express');
const CompanyController = require('../controllers/company.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const cnpjMiddleware = require('../middlewares/cnpj.middleware');

const routes = Router();

// Para cadastrar uma empresa, o usuário precisa estar autenticado (authMiddleware) 
// E o CNPJ enviado precisa ser válido (cnpjMiddleware)
routes.post('/company/register', authMiddleware, cnpjMiddleware, CompanyController.create);

module.exports = routes;
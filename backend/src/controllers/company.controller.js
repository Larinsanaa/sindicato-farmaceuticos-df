// src/controllers/company.controller.js
const RegisterCompanyService = require('../services/registerCompany.service');

class CompanyController {
  async create(req, res) {
    try {
      // O req.userId foi injetado pelo authMiddleware, e o req.body já tem o CNPJ validado
      const { name, cnpj } = req.body;
      const ownerId = req.userId; 

      const company = await RegisterCompanyService.execute({ name, cnpj, ownerId });
      
      return res.status(201).json(company);
    } catch (error) {
      // Captura erros de regras de negócio (ex: CNPJ já cadastrado no banco)
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new CompanyController();
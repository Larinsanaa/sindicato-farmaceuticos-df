// src/services/registerCompany.service.js
import CompanyModel from '../models/company.model.js';

class RegisterCompanyService {
  async execute({ name, cnpj, ownerId }) {
    // Regra de Negócio: Verificar no banco se esse CNPJ já existe
    const companyExists = await CompanyModel.findByCnpj(cnpj);

    if (companyExists) {
      throw new Error('Este CNPJ já está cadastrado no sistema por outra empresa.');
    }

    // Se estiver livre, solicita a criação ao Model
    const newCompany = await CompanyModel.create({
      name,
      cnpj,
      owner_id: ownerId // Vincula a empresa ao usuário que a cadastrou
    });

    return newCompany;
  }
}

export default new RegisterCompanyService();
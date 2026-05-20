// src/models/company.model.js
const { supabase } = require("../../config");

class CompanyModel {
  // Busca empresa por CNPJ
  async findByCnpj(cnpj) {
    const { data, error } = await supabase
        .from('empresa') // Nome da sua tabela no Supabase
        .select('*')
        .eq('cnpj', cnpj);

    if (error) {
        console.error("Erro ao buscar CNPJ no Supabase:", error);
        throw new Error("Erro interno ao consultar o banco de dados.");
    }

    return data.length === 0 ? null : data[0];
  } 

  // Salva nova empresa
  async create(companyData) {
    const { data, error } = await supabase
        .from('empresa')
        .insert([companyData])
        .select(); 
    
    if (error) {
        console.error("Erro ao inserir empresa no Supabase:", error);
        throw new Error("Erro ao salvar a empresa no banco de dados.");
    }

    return data[0]; 
  }
}

module.exports = new CompanyModel();
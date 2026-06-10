export const demoUsers = [
  {
    id: 1,
    nome: 'Avaliador Demo',
    email: 'avaliador@sindicatodf.com.br',
    senha: 'avaliador123',
    nivel_acesso: 'usuario',
    tipo: 'avaliador'
  },
  {
    id: 2,
    nome: 'Administrador Demo',
    email: 'admin@sindicatodf.com.br',
    senha: 'admin123',
    nivel_acesso: 'presidente',
    tipo: 'presidente'
  }
];

export const demoEvaluations = [
  {
    id: 101,
    avaliador_id: 1,
    farmacia: 'Farmácia Central',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 100',
    cidade: 'Brasília',
    estado: 'DF',
    observacao: 'Exemplo de avaliação em modo demonstração.',
    nota_geral: 4.2,
    classificacao: 'Bom',
    resumo: 'Processo de atendimento e organização adequados.',
    total_respostas: 5,
    created_at: '2026-06-01T10:30:00.000Z'
  },
  {
    id: 102,
    avaliador_id: 2,
    farmacia: 'Farmácia Nobre',
    cnpj: '98.765.432/0001-10',
    endereco: 'Av. Brasília, 250',
    cidade: 'Taguatinga',
    estado: 'DF',
    observacao: 'Avaliação administrativa de referência.',
    nota_geral: 3.8,
    classificacao: 'Regular',
    resumo: 'Há pontos de melhoria no controle de estoque.',
    total_respostas: 5,
    created_at: '2026-06-02T14:15:00.000Z'
  }
];

export const demoResponses = [
  { id: 1, avaliacao_id: 101, secao: 'Atendimento', pergunta: 'Qualidade no atendimento', valor: 4 },
  { id: 2, avaliacao_id: 101, secao: 'Atendimento', pergunta: 'Tempo de espera', valor: 4 },
  { id: 3, avaliacao_id: 101, secao: 'Estoque', pergunta: 'Disponibilidade de medicamentos', valor: 5 },
  { id: 4, avaliacao_id: 102, secao: 'Atendimento', pergunta: 'Qualidade no atendimento', valor: 3 },
  { id: 5, avaliacao_id: 102, secao: 'Estoque', pergunta: 'Organização', valor: 4 }
];

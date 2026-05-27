import { supabase } from '../config/config.js';

class EvaluationModel {
  async createEvaluation(evaluation) {
    const { data, error } = await supabase
      .from('avaliacao')
      .insert([evaluation])
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  }

  async createResponses(responses) {
    const { data, error } = await supabase
      .from('resposta')
      .insert(responses)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('avaliacao')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async listByUser(userId, role) {
    const query = supabase.from('avaliacao').select('*');

    if (role !== 'presidente') {
      query.eq('avaliador_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  async findResponsesByEvaluationId(avaliacaoId) {
    const { data, error } = await supabase
      .from('resposta')
      .select('*')
      .eq('avaliacao_id', avaliacaoId);

    if (error) {
      throw error;
    }

    return data;
  }
}

export default new EvaluationModel();

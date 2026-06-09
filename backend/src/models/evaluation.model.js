import { supabase } from '../config/config.js';

class EvaluationModel {
  async enrichWithEvaluators(evaluations) {
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return evaluations;
    }

    const evaluatorIds = [...new Set(evaluations.map((item) => item.avaliador_id).filter(Boolean))];
    if (evaluatorIds.length === 0) {
      return evaluations;
    }

    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .in('id', evaluatorIds);

    if (error) {
      throw error;
    }

    const usersById = new Map(users.map((user) => [String(user.id), user]));
    return evaluations.map((evaluation) => ({
      ...evaluation,
      avaliador: usersById.get(String(evaluation.avaliador_id)) || null
    }));
  }

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
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const [evaluation] = await this.enrichWithEvaluators([data]);
    return evaluation;
  }

  async listByUser(userId, role) {
    let query = supabase
      .from('avaliacao')
      .select('*')
      .order('created_at', { ascending: false });

    if (role !== 'presidente') {
      query = query.eq('avaliador_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return this.enrichWithEvaluators(data);
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

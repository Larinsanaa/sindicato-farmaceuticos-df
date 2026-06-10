import { isDemoMode, supabase } from '../config/config.js';
import { demoEvaluations, demoResponses, demoUsers } from '../config/demoData.js';

class EvaluationModel {
  async enrichWithEvaluators(evaluations) {
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return evaluations;
    }

    if (isDemoMode) {
      const usersById = new Map(demoUsers.map((user) => [String(user.id), user]));
      return evaluations.map((evaluation) => ({
        ...evaluation,
        avaliador: usersById.get(String(evaluation.avaliador_id)) || null
      }));
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
    if (isDemoMode) {
      const created = {
        id: Date.now(),
        ...evaluation,
        created_at: new Date().toISOString()
      };
      demoEvaluations.unshift(created);
      return created;
    }

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
    if (isDemoMode) {
      const created = responses.map((response, index) => ({
        id: Date.now() + index,
        ...response
      }));
      demoResponses.push(...created);
      return created;
    }

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
    if (isDemoMode) {
      const data = demoEvaluations.find((item) => String(item.id) === String(id));
      if (!data) {
        return null;
      }

      const [evaluation] = await this.enrichWithEvaluators([data]);
      return evaluation;
    }

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
    if (isDemoMode) {
      const data = demoEvaluations
        .filter((item) => role === 'presidente' || String(item.avaliador_id) === String(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return this.enrichWithEvaluators(data);
    }

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
    if (isDemoMode) {
      return demoResponses.filter((item) => String(item.avaliacao_id) === String(avaliacaoId));
    }

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

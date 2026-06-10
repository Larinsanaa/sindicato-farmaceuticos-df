import EvaluationModel from '../models/evaluation.model.js';
import { validarAvaliacao, validarLocalizacao, processarRespostas } from '../utils/evaluation.util.js';

class EvaluationController {
  async create(req, res) {
    try {
      const validation = validarAvaliacao(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const locationValidation = validarLocalizacao(req.body);
      if (!locationValidation.valid) {
        return res.status(400).json({ error: locationValidation.error });
      }

      const { farmacia, cnpj, endereco, observacao } = req.body;
      const respostas = validation.respostas;
      const resultado = processarRespostas(respostas, validation.notasSecao, validation.notaGeral);
      const evaluationPayload = {
        avaliador_id: req.userId,
        farmacia: farmacia.trim(),
        cnpj: cnpj.trim(),
        endereco: endereco.trim(),
        observacao: observacao ? String(observacao).trim() : null,
        nota_geral: resultado.notaGeral,
        classificacao: resultado.classificacao,
        resumo: resultado.resumo,
        total_respostas: resultado.totalRespostas,
        ...locationValidation.location
      };

      const evaluation = await EvaluationModel.createEvaluation(evaluationPayload);

      const responsesToSave = respostas.map((item) => ({
        avaliacao_id: evaluation.id,
        secao: item.secao,
        pergunta: item.pergunta,
        valor: item.valor
      }));

      const savedResponses = await EvaluationModel.createResponses(responsesToSave);

      return res.status(201).json({
        avaliacao: evaluation,
        respostas: savedResponses
      });
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao processar a avaliação.' });
    }
  }

  async list(req, res) {
    try {
      const evaluations = await EvaluationModel.listByUser(req.userId, req.userRole);
      return res.json({ avaliacoes: evaluations });
    } catch (error) {
      console.error('Erro ao listar avaliações:', error);
      return res.status(500).json({ error: 'Erro ao listar avaliações.' });
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params;
      const evaluation = await EvaluationModel.findById(id);

      if (!evaluation) {
        return res.status(404).json({ error: 'Avaliação não encontrada.' });
      }

      if (req.userRole !== 'presidente' && String(evaluation.avaliador_id) !== String(req.userId)) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar esta avaliação.' });
      }

      const responses = await EvaluationModel.findResponsesByEvaluationId(id);
      return res.json({ avaliacao: evaluation, respostas: responses });
    } catch (error) {
      console.error('Erro ao buscar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliação.' });
    }
  }
}

export default new EvaluationController();

import { validarCNPJ } from './cnpj.util.js';

export function validarAvaliacao(body) {
  const { farmacia, cnpj, endereco, respostas } = body;

  if (!farmacia || typeof farmacia !== 'string' || farmacia.trim().length < 3) {
    return { valid: false, error: 'O nome da farmácia é obrigatório e deve conter pelo menos 3 caracteres.' };
  }

  if (!cnpj || typeof cnpj !== 'string') {
    return { valid: false, error: 'O CNPJ é obrigatório e deve ser um texto válido.' };
  }

  if (!validarCNPJ(cnpj)) {
    return { valid: false, error: 'O CNPJ informado é inválido.' };
  }

  if (!endereco || typeof endereco !== 'string' || endereco.trim().length < 5) {
    return { valid: false, error: 'O endereço é obrigatório e deve conter pelo menos 5 caracteres.' };
  }

  if (!respostas || typeof respostas !== 'object') {
    return { valid: false, error: 'As respostas precisam ser enviadas no corpo da requisição.' };
  }

  const rawNotaGeral = body.nota_geral;
  if (rawNotaGeral !== undefined && rawNotaGeral !== null) {
    const notaGeral = Number(rawNotaGeral);
    if (!Number.isFinite(notaGeral) || notaGeral < 1 || notaGeral > 5) {
      return { valid: false, error: 'A nota geral deve ser um número entre 1 e 5.' };
    }
  }

  const normalized = normalizeRespostas(respostas);
  if (normalized.length === 0) {
    return { valid: false, error: 'É necessário enviar pelo menos uma resposta válida.' };
  }

  return { valid: true, respostas: normalized };
}

export function validarLocalizacao(body) {
  const rawLatitude = body.latitude ?? body.localizacao?.latitude;
  const rawLongitude = body.longitude ?? body.localizacao?.longitude;

  const latitude = rawLatitude === undefined ? null : Number(rawLatitude);
  const longitude = rawLongitude === undefined ? null : Number(rawLongitude);

  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    return {
      valid: false,
      error: 'Latitude inválida.'
    };
  }

  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return {
      valid: false,
      error: 'Longitude inválida.'
    };
  }

  return {
    valid: true,
    location: {
      latitude: latitude ?? null,
      longitude: longitude ?? null
    }
  };
}

export function normalizeRespostas(respostas) {
  if (Array.isArray(respostas)) {
    return respostas
      .map((item) => ({
        secao: String(item.secao || '').trim(),
        pergunta: String(item.pergunta || '').trim(),
        valor: Number(item.valor)
      }))
      .filter((item) => {
        return (
          item.secao &&
          item.pergunta &&
          Number.isInteger(item.valor) &&
          item.valor >= 1 &&
          item.valor <= 3
        );
      });
  }

  return Object.entries(respostas)
    .map(([chave, valor]) => {
      const [secaoIndex, perguntaIndex] = chave.split('-').map(Number);
      const parsedValor = Number(valor);

      if (!Number.isInteger(secaoIndex) || !Number.isInteger(perguntaIndex)) {
        return null;
      }

      return {
        secaoIndice: secaoIndex,
        perguntaIndice: perguntaIndex,
        secao: `seção ${secaoIndex}`,
        pergunta: `pergunta ${perguntaIndex}`,
        valor: parsedValor
      };
    })
    .filter((item) => {
      return (
        item &&
        Number.isInteger(item.valor) &&
        item.valor >= 1 &&
        item.valor <= 3
      );
    });
}

export function processarRespostas(respostas, notaGeralInformada = null) {
  const totalRespostas = respostas.length;
  const somaValores = respostas.reduce((sum, item) => sum + item.valor, 0);
  const notaMediaRespostas = totalRespostas > 0 ? somaValores / totalRespostas : 0;
  const notaGeral = Number((notaGeralInformada !== null && Number.isFinite(Number(notaGeralInformada)) ? Number(notaGeralInformada) : notaMediaRespostas).toFixed(2));
  const classificacao = notaGeral >= 4.5 ? 'Ótimo' : notaGeral >= 3.5 ? 'Bom' : notaGeral >= 2.5 ? 'Regular' : 'Ruim';

  const resumo = `Avaliação registrada com ${totalRespostas} respostas. Nota geral ${notaGeral}. Classificação: ${classificacao}.`;

  return {
    notaGeral,
    classificacao,
    resumo,
    totalRespostas
  };
}

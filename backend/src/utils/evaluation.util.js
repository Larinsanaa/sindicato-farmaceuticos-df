import { validarCNPJ } from './cnpj.util.js';

export function validarAvaliacao(body) {
  const { farmacia, cnpj, endereco, respostas, notasSecao, notaGeral } = body;

  if (!farmacia || typeof farmacia !== 'string' || farmacia.trim().length < 3) {
    return { valid: false, error: 'O nome da farmacia e obrigatorio e deve conter pelo menos 3 caracteres.' };
  }

  if (!cnpj || typeof cnpj !== 'string') {
    return { valid: false, error: 'O CNPJ e obrigatorio e deve ser um texto valido.' };
  }

  if (!validarCNPJ(cnpj)) {
    return { valid: false, error: 'O CNPJ informado e invalido.' };
  }

  if (!endereco || typeof endereco !== 'string' || endereco.trim().length < 5) {
    return { valid: false, error: 'O endereco e obrigatorio e deve conter pelo menos 5 caracteres.' };
  }

  if (!respostas || typeof respostas !== 'object') {
    return { valid: false, error: 'As respostas precisam ser enviadas no corpo da requisicao.' };
  }

  const normalized = normalizeRespostas(respostas);
  if (normalized.length === 0) {
    return { valid: false, error: 'E necessario enviar pelo menos uma resposta valida.' };
  }

  return {
    valid: true,
    respostas: normalized,
    notasSecao: normalizeNotasSecao(notasSecao),
    notaGeral: normalizeNotaGeral(notaGeral)
  };
}

export function validarLocalizacao(body) {
  const locationEnabled = body.localizacao_ativa ?? body.locationEnabled;
  const rawLatitude = body.latitude ?? body.localizacao?.latitude;
  const rawLongitude = body.longitude ?? body.localizacao?.longitude;

  if (locationEnabled !== undefined && String(locationEnabled).toLowerCase() !== 'true') {
    return {
      valid: false,
      error: 'A avaliacao so pode ser registrada se a localizacao estiver ligada.'
    };
  }

  if (rawLatitude === undefined || rawLongitude === undefined) {
    return {
      valid: false,
      error: 'A avaliacao so pode ser registrada com a localizacao ligada. Envie latitude e longitude.'
    };
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      valid: false,
      error: 'Latitude e longitude devem ser numeros validos.'
    };
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: 'Latitude ou longitude estao fora do intervalo permitido.'
    };
  }

  return { valid: true, location: { latitude, longitude } };
}

export function normalizeRespostas(respostas) {
  if (Array.isArray(respostas)) {
    return respostas
      .map((item) => ({
        secao: String(item.secao || '').trim(),
        pergunta: String(item.pergunta || '').trim(),
        valor: Number(item.valor)
      }))
      .filter((item) => (
        item.secao &&
        item.pergunta &&
        Number.isInteger(item.valor) &&
        item.valor >= 1 &&
        item.valor <= 3
      ));
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
        secao: `secao ${secaoIndex}`,
        pergunta: `pergunta ${perguntaIndex}`,
        valor: parsedValor
      };
    })
    .filter((item) => (
      item &&
      Number.isInteger(item.valor) &&
      item.valor >= 1 &&
      item.valor <= 3
    ));
}

export function normalizeNotasSecao(notasSecao) {
  if (!notasSecao || typeof notasSecao !== 'object') {
    return [];
  }

  return Object.values(notasSecao)
    .map((valor) => Number(valor))
    .filter((valor) => Number.isFinite(valor) && valor >= 1 && valor <= 5);
}

export function normalizeNotaGeral(notaGeral) {
  const nota = Number(notaGeral);
  return Number.isFinite(nota) && nota >= 1 && nota <= 5 ? nota : null;
}

export function processarRespostas(respostas, notasSecao = [], notaGeralInformada = null) {
  const totalRespostas = respostas.length;
  const notasValidas = Array.isArray(notasSecao) ? notasSecao : [];
  const notaPorEstrelas = notasValidas.length > 0
    ? notasValidas.reduce((sum, item) => sum + item, 0) / notasValidas.length
    : null;
  const notaMedia = notaGeralInformada || notaPorEstrelas || calcularNotaPelasRespostas(respostas);
  const notaGeral = Number(notaMedia.toFixed(2));
  const classificacao = classificarNotaCinco(notaGeral);
  const resumo = `Avaliacao registrada com ${totalRespostas} respostas. Nota geral ${notaGeral}. Classificacao: ${classificacao}.`;

  return {
    notaGeral,
    classificacao,
    resumo,
    totalRespostas
  };
}

function calcularNotaPelasRespostas(respostas) {
  const totalRespostas = respostas.length;
  const somaValores = respostas.reduce((sum, item) => sum + item.valor, 0);
  const mediaEmoji = totalRespostas > 0 ? somaValores / totalRespostas : 0;

  if (!mediaEmoji) {
    return 0;
  }

  return ((mediaEmoji - 1) / 2) * 4 + 1;
}

function classificarNotaCinco(nota) {
  if (nota >= 4.5) return 'Otimo';
  if (nota >= 3.5) return 'Bom';
  if (nota >= 2.5) return 'Regular';
  return 'Critico';
}

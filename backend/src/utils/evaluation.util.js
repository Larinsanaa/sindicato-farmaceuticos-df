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
        item.valor <= 5
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
      item.valor <= 5
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
  const resumo = gerarResumoExecutivo(respostas, notaGeral, classificacao);

  return {
    notaGeral,
    classificacao,
    resumo,
    totalRespostas
  };
}

// As respostas já vêm na escala de estrelas (1 a 5) — a nota é a média direta.
function calcularNotaPelasRespostas(respostas) {
  const totalRespostas = respostas.length;

  if (totalRespostas === 0) {
    return 0;
  }

  return respostas.reduce((sum, item) => sum + item.valor, 0) / totalRespostas;
}

function formatarNotaTexto(nota) {
  return Number(nota).toFixed(1).replace('.', ',');
}

// Monta um resumo executivo descritivo, citando desempenho por seção e
// itens que precisam de correção — texto que vai pro relatório em PDF.
function gerarResumoExecutivo(respostas, notaGeral, classificacao) {
  const porSecao = new Map();
  respostas.forEach((item) => {
    const secao = item.secao || 'Seção';
    if (!porSecao.has(secao)) porSecao.set(secao, []);
    porSecao.get(secao).push(Number(item.valor));
  });

  const secoes = [...porSecao.entries()].map(([secao, valores]) => {
    const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
    return { secao, nota: media };
  });

  const aberturas = {
    Otimo: 'A unidade apresentou desempenho excelente',
    Bom: 'A unidade apresentou bom desempenho geral',
    Regular: 'A unidade apresentou desempenho regular',
    Critico: 'A unidade apresentou desempenho abaixo do esperado'
  };

  const frases = [
    `${aberturas[classificacao] || 'A unidade foi avaliada'}, com nota geral ${formatarNotaTexto(notaGeral)} (escala de 1 a 5), apurada a partir de ${respostas.length} itens verificados em ${secoes.length} seções.`
  ];

  if (secoes.length >= 2) {
    const ordenadas = [...secoes].sort((a, b) => b.nota - a.nota);
    const melhor = ordenadas[0];
    const pior = ordenadas[ordenadas.length - 1];

    if (melhor.nota !== pior.nota) {
      frases.push(`O melhor resultado foi registrado na seção ${melhor.secao} (${formatarNotaTexto(melhor.nota)}) e o menor na seção ${pior.secao} (${formatarNotaTexto(pior.nota)}).`);
    } else {
      frases.push(`As seções avaliadas apresentaram desempenho uniforme, com nota ${formatarNotaTexto(melhor.nota)}.`);
    }
  }

  const itensCriticos = respostas.filter((item) => Number(item.valor) <= 2).length;
  if (itensCriticos > 0) {
    frases.push(itensCriticos === 1
      ? '1 item recebeu nota baixa (2 estrelas ou menos) e demanda ação corretiva prioritária.'
      : `${itensCriticos} itens receberam nota baixa (2 estrelas ou menos) e demandam ação corretiva prioritária.`);
  } else {
    frases.push('Nenhum item recebeu nota baixa durante a verificação.');
  }

  return frases.join(' ');
}

function classificarNotaCinco(nota) {
  if (nota >= 4.5) return 'Otimo';
  if (nota >= 3.5) return 'Bom';
  if (nota >= 2.5) return 'Regular';
  return 'Critico';
}

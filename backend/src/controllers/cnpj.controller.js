import { validarCNPJ } from '../utils/cnpj.util.js';

const BRASILAPI_URL = 'https://brasilapi.com.br/api/cnpj/v1';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'sindicato-farmaceuticos-df/1.0';

// Limites aproximados do Distrito Federal. Coordenada fora disso pra um
// endereço do DF é geocodificação errada, não farmácia.
const LIMITES_DF = { latMin: -16.1, latMax: -15.45, lonMin: -48.3, lonMax: -47.3 };

function dentroDoDf({ latitude, longitude }) {
  return latitude >= LIMITES_DF.latMin && latitude <= LIMITES_DF.latMax
    && longitude >= LIMITES_DF.lonMin && longitude <= LIMITES_DF.lonMax;
}

function normalizarTexto(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

// Pega só a parte "endereçável" do logradouro: "SGAN 601 CJ H SEMIENTERRADO
// SALA 04/19" vira "SGAN 601". Complementos (conjunto, bloco, sala...) só
// atrapalham a busca no OpenStreetMap.
function extrairNucleoLogradouro(logradouro) {
  const texto = normalizarTexto(logradouro).split(',')[0]
    .replace(/^(QUADRA|QD|Q)\s+/, ''); // OSM chama "QUADRA EQNP 17/13" só de "EQNP 17/13"
  const corte = texto.search(/\b(CJ|CONJ|CONJUNTO|BL|BLOCO|LT|LOTE|LJ|LOJA|SL|SALA|TERREO|SUBSOLO|SOBRELOJA|ANDAR|APT|APTO|KM|ED|EDIF|EDIFICIO)\b/);
  const nucleo = (corte >= 0 ? texto.slice(0, corte) : texto).trim().replace(/[,\s]+$/, '');
  return nucleo.length >= 4 ? nucleo : null;
}

// Converte o endereço da empresa em coordenadas usando o Nominatim (OpenStreetMap).
// Retorna null se nada confiável resolver — pro app, nenhuma coordenada é melhor
// que uma coordenada errada (que bloqueia o avaliador longe do lugar certo).
//
// Estratégia (endereços do DF raramente existem por extenso no OpenStreetMap):
// 1) nome fantasia + bairro — acha a própria farmácia quando ela está mapeada;
// 2) núcleo do logradouro + bairro — acha a quadra/via do endereço;
//    Nos dois casos o resultado só vale se citar o núcleo do logradouro, pra não
//    aceitar homônimos longe (ex.: "SGAN 601" casando com a via "SGAN 909").
// 3) CEP em busca estruturada (postalcode=...), que nunca casa por nome de loja.
async function geocodificarEndereco(dados) {
  const nucleo = extrairNucleoLogradouro(dados.logradouro);
  const cep = String(dados.cep || '').replace(/\D/g, '');

  const tentativas = [];
  if (nucleo && dados.nome_fantasia) {
    tentativas.push({ consulta: { q: [dados.nome_fantasia, dados.bairro, dados.municipio, dados.uf].filter(Boolean).join(', ') }, exigeNucleo: true });
  }
  if (nucleo) {
    tentativas.push({ consulta: { q: [nucleo, dados.bairro, dados.municipio, dados.uf].filter(Boolean).join(', ') }, exigeNucleo: true });
  }
  if (cep.length === 8) {
    tentativas.push({ consulta: { postalcode: cep }, exigeNucleo: false });
  }

  for (const { consulta, exigeNucleo } of tentativas) {
    try {
      const params = new URLSearchParams({ ...consulta, format: 'json', limit: '5', countrycodes: 'br' });
      const resposta = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(6000)
      });

      if (!resposta.ok) continue;

      const resultados = await resposta.json();
      for (const lugar of resultados || []) {
        if (!lugar?.lat || !lugar?.lon) continue;
        if (exigeNucleo && !normalizarTexto(lugar.display_name).includes(nucleo)) continue;

        const coordenadas = { latitude: Number(lugar.lat), longitude: Number(lugar.lon) };
        if (dados.uf === 'DF' && !dentroDoDf(coordenadas)) continue;

        return coordenadas;
      }
    } catch {
      // tenta a próxima consulta
    }
  }

  return null;
}

// Consulta os dados de um CNPJ na BrasilAPI pelo servidor.
// Feito no backend porque a chamada direta do navegador falha quando a
// BrasilAPI responde sem o header CORS (rate limit/erro) ou quando extensões
// do usuário bloqueiam a requisição.
async function lookup(req, res) {
  const numeros = String(req.params.cnpj || '').replace(/[^\d]+/g, '');

  if (!validarCNPJ(numeros)) {
    return res.status(400).json({ error: 'CNPJ inválido.' });
  }

  try {
    // A BrasilAPI (Cloudflare) responde 403 pra requisições sem User-Agent.
    const resposta = await fetch(`${BRASILAPI_URL}/${numeros}`, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (resposta.status === 404) {
      return res.status(404).json({ error: 'Nenhuma empresa encontrada com esse CNPJ.' });
    }

    if (!resposta.ok) {
      return res.status(502).json({ error: 'Serviço de consulta de CNPJ indisponível. Tente novamente em instantes.' });
    }

    const dados = await resposta.json();
    const coordenadas = await geocodificarEndereco(dados);
    return res.json({ ...dados, localizacao: coordenadas });
  } catch {
    return res.status(502).json({ error: 'Não foi possível consultar o CNPJ. Tente novamente em instantes.' });
  }
}

export default { lookup };

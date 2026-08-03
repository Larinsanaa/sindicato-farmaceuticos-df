import { validarCNPJ } from '../utils/cnpj.util.js';

const BRASILAPI_URL = 'https://brasilapi.com.br/api/cnpj/v1';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'sindicato-farmaceuticos-df/1.0';

// Converte o endereço da empresa em coordenadas usando o Nominatim (OpenStreetMap).
// Tenta o endereço completo e, se não achar, cai pro CEP — endereços do DF nem
// sempre são reconhecidos por extenso. Retorna null se nada resolver.
async function geocodificarEndereco(dados) {
  const tentativas = [
    [dados.logradouro, dados.numero, dados.bairro, dados.municipio, dados.uf, 'Brasil'].filter(Boolean).join(', '),
    [dados.cep, dados.municipio, dados.uf, 'Brasil'].filter(Boolean).join(', ')
  ].filter((consulta) => consulta.length > 10);

  for (const consulta of tentativas) {
    try {
      const params = new URLSearchParams({ q: consulta, format: 'json', limit: '1', countrycodes: 'br' });
      const resposta = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(6000)
      });

      if (!resposta.ok) continue;

      const resultados = await resposta.json();
      const lugar = resultados?.[0];
      if (lugar?.lat && lugar?.lon) {
        return { latitude: Number(lugar.lat), longitude: Number(lugar.lon) };
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

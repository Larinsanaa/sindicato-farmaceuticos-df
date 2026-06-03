import { validarCNPJ } from '../utils/cnpj.util.js';

export default function cnpjMiddleware(req, res, next) {
  const { cnpj } = req.body;

  if (!cnpj || !validarCNPJ(cnpj)) {
    return res.status(400).json({ error: 'CNPJ inválido.' });
  }

  return next();
}

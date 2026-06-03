import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config.js';

export default (req, res, next) => {
  const authHeader = req.headers.authorization; 

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  } 

  const parts = authHeader.split(' '); 

    // Verifica se o token tem exatamente duas partes (ex: "Bearer token_aqui")
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  } 

  const [scheme, token] = parts; 

  // Usa uma expressão regular para validar se o texto contido em 'scheme' é estritamente "Bearer" (case-insensitive)
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token malformatado.' });
  } 

  
  const SEGREDO_JWT = jwtSecret;

  jwt.verify(token, SEGREDO_JWT, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    } 

    req.userId = decoded.id; 

    return next(); 
  });
};
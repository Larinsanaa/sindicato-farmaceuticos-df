import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config.js';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    return res.status(401).json({ error: 'Token malformatado.' });
  }

  try {
    const decoded = jwt.verify(parts[1], jwtSecret);
    req.userId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

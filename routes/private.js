import express from 'express';
import {supabase} from '../config.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sindicato-farmaceuticos-df-secret-key';

// Middleware para autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Aplicar middleware de autenticação a todas as rotas privadas
router.use(authenticateToken);

//Listar usuários
router.get('/usuarios', async (req, res) => {
    const { data, error } = await supabase
    .from('usuario')
    .select('*');

    if(error){
        console.error("Erro Supabase:", error);
        return res.status(500).json({error: "Erro ao buscar usuários", details: error.message});
    }

    return res.status(200).json({ data });
});

//Excluir usuário
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
        return res.status(400).json({ error: 'ID inválido. Use um número inteiro positivo.' });
    }

    const { data, error } = await supabase
    .from('usuario')
    .delete()
    .eq('id', numericId);

    if(error){
        console.error("Erro Supabase:", error);
        return res.status(500).json({error: "Erro ao excluir usuário", details: error.message});
    }

    return res.status(200).json({ message: 'Usuário excluído com sucesso', data });
});

export default router;

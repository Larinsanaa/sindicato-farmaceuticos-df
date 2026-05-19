import express from 'express';
import { supabase } from '../config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sindicato-farmaceuticos-df-secret-key';

router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
        .from('usuario')
        .insert([{ nome, email, senha: senhaCriptografada }])
        .select('id, nome, email');

    if (error) {
        return res.status(500).json({ error: 'Erro ao cadastrar usuario.' });
    }

    return res.status(201).json({
        message: 'Conta criada com sucesso.',
        usuario: data[0]
    });
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Preencha email e senha.' });
    }

    const { data: usuario, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !usuario) {
        return res.status(401).json({ error: 'Email ou senha invalidos.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
        return res.status(401).json({ error: 'Email ou senha invalidos.' });
    }

    const dadosUsuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    };

    const token = jwt.sign(dadosUsuario, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        usuario: dadosUsuario
    });
});

router.get('/usuarios', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Token nao enviado.' });
    }

    try {
        jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(403).json({ error: 'Token invalido.' });
    }

    const { data, error } = await supabase
        .from('usuario')
        .select('*');

    if (error) {
        return res.status(500).json({ error: 'Erro ao buscar usuarios.' });
    }

    return res.status(200).json({ data });
});

export default router;

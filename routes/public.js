import express from 'express';
import { supabase } from '../config.js';
import bcrypt from 'bcrypt';

const router = express.Router();

//Cadastro
router.post('/cadastro', async (req, res) => {
    console.log('Dados recebidos:', req.body); // Debug: ver o que está sendo enviado
    const { nome, email, senha } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    if(!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const { data, error } = await supabase
    .from('usuario')
    .insert([{ nome, email, senha: hashedPassword }]);

    if(error){
        console.error("Erro Supabase:", error);
        return res.status(500).json({error: "Erro ao cadastrar usuário", details: error.message});
    }

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso', data});
});

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
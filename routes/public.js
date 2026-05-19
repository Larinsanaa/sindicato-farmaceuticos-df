import express from 'express';
import { supabase } from '../config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sindicato-farmaceuticos-df-secret-key';

const renderForm = (res, options = {}) => {
    return res.render('formulario', options);
};

//Pagina principal
router.get('/', (req, res) => {
    renderForm(res, { form: 'login' });
});

//Abas diretas
router.get('/login', (req, res) => {
    renderForm(res, { form: 'login' });
});

router.get('/cadastro', (req, res) => {
    renderForm(res, { form: 'cadastro' });
});

//Cadastro
router.post('/cadastro', async (req, res) => {
    console.log('Dados recebidos:', req.body); // Debug: ver o que está sendo enviado
    const { nome, email, senha } = req.body;

    if(!nome || !email || !senha) {
        return renderForm(res, { error: 'Todos os campos são obrigatórios', form: 'cadastro', nome, email });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const { data, error } = await supabase
            .from('usuario')
            .insert([{ nome, email, senha: hashedPassword }]);

        if(error){
            console.error("Erro Supabase:", error);
            return renderForm(res, { error: 'Erro ao cadastrar usuário', details: error.message, form: 'cadastro', nome, email });
        }

        return renderForm(res, { success: 'Usuário cadastrado com sucesso!', form: 'cadastro', nome, email });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        return renderForm(res, { error: 'Erro interno ao cadastrar usuário', details: error.message, form: 'cadastro', nome, email });
    }
});

//LOGIN
router.post('/login', async (req, res) => {
    try{
        const { email, senha } = req.body;

        if(!email || !senha){
            return renderForm(res, { error: 'Email e senha são obrigatórios', form: 'login', email });
        }

        // Buscar o usuário pelo email
        const { data: user, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return renderForm(res, { error: 'Email ou senha inválidos', form: 'login', email });
        }

        // Verificar a senha usando bcrypt
        const isPasswordValid = await bcrypt.compare(senha, user.senha);

        if (!isPasswordValid) {
            return renderForm(res, { error: 'Email ou senha inválidos', form: 'login', email });
        }

        // Gerar token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        return renderForm(res, {
            success: 'Login bem-sucedido!',
            form: 'login',
            token,
            user: { id: user.id, nome: user.nome, email: user.email }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return renderForm(res, { error: 'Erro ao processar login', details: error.message, form: 'login' });
    }
});

export default router;
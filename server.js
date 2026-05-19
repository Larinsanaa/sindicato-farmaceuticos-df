import express from 'express';
import publicRoutes from './routes/public.js';
import privateRoutes from './routes/private.js';
import apiRoutes from './routes/api.js';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
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

//configuração do handlebars
app.engine('handlebars', engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');


//Configurações para rotas 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);
app.use('/', publicRoutes);
app.use('/', privateRoutes);


app.listen(3001, () =>{
    console.log('Servidor rodando na porta 3001');
});

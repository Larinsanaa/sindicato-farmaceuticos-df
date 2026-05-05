import express from 'express';
import publicRoutes from './routes/public.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/', publicRoutes);


app.listen(3001, () =>{
    console.log('Servidor rodando na porta 3001');
});
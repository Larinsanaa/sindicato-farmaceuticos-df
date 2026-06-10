import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', evaluationRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada. Use /api/login, /api/cadastro, /api/avaliacoes e /api/meu-perfil.'
  });
});

export default app;

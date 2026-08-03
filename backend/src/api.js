import express from 'express';
import authRoutes from './routes/auth.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import cnpjRoutes from './routes/cnpj.routes.js';

const app = express();

// Limite maior para aceitar a foto de perfil em base64
app.use(express.json({ limit: '4mb' }));
app.use('/api', authRoutes);
app.use('/auth', authRoutes);
app.use('/', authRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', cnpjRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.'
  });
});

export default app;

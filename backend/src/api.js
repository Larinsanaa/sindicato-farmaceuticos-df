import express from 'express';
import authRoutes from './routes/auth.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';

const app = express();

app.use(express.json());
app.use('/api', authRoutes);
app.use('/auth', authRoutes);
app.use('/', authRoutes);
app.use('/api', evaluationRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada.'
  });
});

export default app;

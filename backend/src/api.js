import express from 'express';
import authRoutes from './routes/auth.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';

const app = express();

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', evaluationRoutes);
app.use('/auth', authRoutes);

export default app;

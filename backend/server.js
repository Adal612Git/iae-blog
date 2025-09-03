import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Ping route
app.get('/api/ping', (_req, res) => {
  res.json({ message: 'pong' });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:5000');
});


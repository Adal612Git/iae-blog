import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET no está definida en el entorno' });
    }

    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });
    return res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// POST /api/auth/register (solo admin)
router.post('/register', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { email, password, role = 'user' } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({ email, passwordHash, role });

    // No devolver passwordHash
    return res.status(201).json({ id: created._id, email: created.email, role: created.role });
  } catch (err) {
    console.error('Error en /register:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

export default router;
